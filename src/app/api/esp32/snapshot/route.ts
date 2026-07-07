import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable, query, queryOne } from "@/lib/db";
import { timingSafeStringEqual } from "@/lib/oauth";
import { getUserId } from "@/lib/auth";

/**
 * POST /api/esp32/snapshot
 * ESP32 (Push Mode firmware, esp32/PurrDictCam_Push) uploads a JPEG
 * snapshot every ~500ms as a binary body.
 * Header: X-Device-Secret: <secret returned by POST /api/esp32/pair>
 *
 * GET /api/esp32/snapshot?catId=xxx
 * Returns the latest JPEG snapshot for the authenticated user's cat.
 *
 * Improper Access Control fix: this endpoint previously accepted
 * uploads with no credential at all, and served the single most-recent
 * snapshot to *any* caller out of one global in-memory variable shared
 * across every device and every user. In a multi-tenant deployment that
 * meant anyone's dashboard could see anyone else's camera feed (or have
 * it clobbered by another user's device), regardless of which cat/device
 * they'd actually paired. The cache is now keyed per device_id, POST
 * requires the device secret issued at pairing, and GET requires the
 * caller's JWT plus proof the requested cat belongs to them.
 *
 * Performance note (unchanged from before): the database is a remote
 * Neon Postgres instance, so a per-device in-memory cache is still the
 * source of truth for the hot path — POST responds immediately after
 * buffering, DB persistence happens in the background fire-and-forget
 * purely for surviving Vercel cold starts.
 */

interface SnapshotCacheEntry {
  buffer: Buffer;
  time: number;
}

// In-memory cache keyed by esp32_devices.id — each device's frames are
// independent of every other device's.
const snapshotCache = new Map<string, SnapshotCacheEntry>();

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientDeviceId = searchParams.get("deviceId");
    const deviceSecret = request.headers.get("x-device-secret");

    if (!isDbAvailable()) {
      // Demo mode — nothing to authenticate against; just acknowledge.
      return NextResponse.json({ ok: true, mode: "demo" });
    }

    if (!clientDeviceId || !deviceSecret) {
      return NextResponse.json(
        { error: "Missing deviceId or X-Device-Secret header. Pair the device first via /api/esp32/pair." },
        { status: 401 }
      );
    }

    const device = await queryOne<{ id: string; device_secret: string | null }>(
      "SELECT id, device_secret FROM esp32_devices WHERE id::text = $1 OR pin = $1 LIMIT 1",
      [clientDeviceId]
    );
    if (!device || !device.device_secret || !timingSafeStringEqual(deviceSecret, device.device_secret)) {
      return NextResponse.json({ error: "Invalid device credentials." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let imageBuffer: Buffer;

    if (contentType.includes("application/json")) {
      // Base64 JSON upload
      const body = await request.json();
      if (!body.image) {
        return NextResponse.json({ error: "Missing image field" }, { status: 400 });
      }
      const base64Data = body.image.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      // Binary JPEG (image/jpeg, application/octet-stream, or raw fallback)
      const arrayBuffer = await request.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    if (imageBuffer.length < 100) {
      return NextResponse.json({ error: "Image too small" }, { status: 400 });
    }

    // Hot path: update this device's in-memory cache entry immediately
    // and respond to the ESP32 right away — nothing here waits on the DB.
    snapshotCache.set(device.id, { buffer: imageBuffer, time: Date.now() });

    // Background persistence (fire-and-forget): only matters for surviving
    // a Vercel cold start between pushes. Errors here must never affect
    // the response already sent to the ESP32.
    persistSnapshotInBackground(imageBuffer, device.id);

    return NextResponse.json({ ok: true, size: imageBuffer.length });
  } catch (error) {
    console.error("Snapshot upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

async function persistSnapshotInBackground(imageBuffer: Buffer, deviceId: string) {
  try {
    const base64Image = imageBuffer.toString("base64");
    await query(
      `UPDATE esp32_devices
       SET latest_snapshot = $1, latest_snapshot_at = now(), last_seen = now(), is_online = true
       WHERE id = $2`,
      [base64Image, deviceId]
    );
  } catch (error) {
    // Non-fatal — the in-memory cache already served the live feed.
    console.error("Background snapshot persistence failed:", error);
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication before processing any request
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const catId = searchParams.get("catId");
    
    // SECURITY: Require catId parameter to prevent any potential data leakage
    if (!catId) {
      return NextResponse.json({ error: "catId is required." }, { status: 400 });
    }

    // SECURITY: Even in demo mode (no DB), we still require authentication and catId
    // to maintain consistent security posture across all deployment modes
    if (!isDbAvailable()) {
      return respondWithSnapshot(null, 0);
    }

    // SECURITY: Verify the requested cat belongs to the authenticated user
    // This prevents horizontal privilege escalation where an attacker with a valid
    // JWT could attempt to access another user's cat snapshots by guessing catId values
    const cat = await queryOne<{ id: string }>(
      "SELECT id FROM cats WHERE id = $1 AND owner_id = $2",
      [catId, userId]
    );
    if (!cat) {
      return NextResponse.json({ error: "Cat not found for this account." }, { status: 404 });
    }

    // SECURITY: Query devices only for the verified cat (already confirmed to belong to userId)
    // This ensures we never return snapshots from devices paired to other users' cats
    const device = await queryOne<{ id: string; latest_snapshot: string | null; latest_snapshot_at: string | null }>(
      `SELECT id, latest_snapshot, latest_snapshot_at
       FROM esp32_devices
       WHERE cat_id = $1
       ORDER BY last_seen DESC NULLS LAST
       LIMIT 1`,
      [catId]
    );

    if (!device) {
      return respondWithSnapshot(null, 0);
    }

    // Hot path: serve straight from this device's in-memory cache entry.
    const cached = snapshotCache.get(device.id);
    if (cached) {
      return respondWithSnapshot(cached.buffer, cached.time);
    }

    // Memory is empty (fresh serverless cold start) — fall back to the DB
    // so a Vercel deployment can still recover the last known frame.
    if (device.latest_snapshot) {
      const buffer = Buffer.from(device.latest_snapshot, "base64");
      const snapshotTime = device.latest_snapshot_at
        ? new Date(device.latest_snapshot_at).getTime()
        : 0;
      // Warm the in-memory cache so subsequent polls skip the DB entirely.
      snapshotCache.set(device.id, { buffer, time: snapshotTime });
      return respondWithSnapshot(buffer, snapshotTime);
    }

    return respondWithSnapshot(null, 0);
  } catch (error) {
    console.error("Snapshot fetch error:", error);
    return respondWithSnapshot(null, 0);
  }
}

function respondWithSnapshot(buffer: Buffer | null, snapshotTime: number) {
  if (!buffer || Date.now() - snapshotTime > 30000) {
    // No snapshot, or older than 30s (device likely offline) — return a
    // 1x1 transparent-ish placeholder JPEG instead of a broken image.
    const pixel = Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsM" +
      "DhEQDg4RDgwSExQVFBMUFRkZGx0dHR8fJCQkJCQkJCT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQU" +
      "FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFAAB" +
      "AAAAAAAAAAAAAAAAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAU" +
      "EQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==",
      "base64"
    );
    return new NextResponse(new Uint8Array(pixel), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Snapshot-Age": "none",
        // SECURITY: No CORS headers - this endpoint requires authentication
        // and should only be accessed same-origin from the authenticated dashboard
      },
    });
  }

  // SECURITY: No "Access-Control-Allow-Origin: *" header is set here.
  // This response carries a specific user's cat snapshot and is fetched same-origin
  // from the dashboard with a Bearer token. A wildcard CORS header would allow
  // any third-party site to read an authenticated user's private camera frame
  // if it were ever fetched cross-origin with credentials. The absence of CORS
  // headers ensures this endpoint can only be accessed by same-origin requests.
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Snapshot-Time": snapshotTime.toString(),
      "X-Snapshot-Age": `${Math.round((Date.now() - snapshotTime) / 1000)}s`,
    },
  });
}
