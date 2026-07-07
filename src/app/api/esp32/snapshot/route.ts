import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable, query } from "@/lib/db";

/**
 * POST /api/esp32/snapshot
 * ESP32 (Push Mode firmware, esp32/PurrDictCam_Push) uploads a JPEG
 * snapshot every ~500ms as a binary body.
 *
 * GET /api/esp32/snapshot
 * Returns the latest JPEG snapshot as an image.
 *
 * Performance note: the database is a remote Neon Postgres instance
 * (often a different region/continent from the dev machine). Awaiting a
 * DB round-trip on every single POST/GET — happening every ~500-800ms —
 * added several hundred ms of latency per request and caused the ESP32's
 * requests to pile up/timeout under any network jitter, which showed up
 * as a laggy/stalling video feed.
 *
 * Fix: an in-memory cache is now the source of truth for the hot path.
 * - POST responds immediately after buffering in memory; the DB write
 *   happens in the background (fire-and-forget) purely for durability
 *   across serverless cold starts on Vercel — it no longer blocks the
 *   response to the ESP32.
 * - GET serves straight from memory. It only falls back to the DB if
 *   memory is empty (e.g. a fresh serverless instance that hasn't
 *   received a push yet since cold start).
 */

// In-memory cache — primary source of truth for the live feed. Always
// used when populated, regardless of whether a DB is configured.
let latestSnapshot: Buffer | null = null;
let latestSnapshotTime = 0;
let latestDeviceId: string | null = null;

function findDeviceId(clientDeviceId?: string) {
  if (clientDeviceId) {
    return query<{ id: string }>(
      "SELECT id FROM esp32_devices WHERE id::text = $1 OR pin = $1 LIMIT 1",
      [clientDeviceId]
    );
  }
  return query<{ id: string }>(
    "SELECT id FROM esp32_devices ORDER BY last_seen DESC NULLS LAST LIMIT 1",
    []
  );
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const { searchParams } = new URL(request.url);
    const clientDeviceId = searchParams.get("deviceId") || undefined;

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

    // Hot path: update the in-memory cache immediately and respond to the
    // ESP32 right away. This is what keeps frame delivery fast/real-time —
    // nothing here waits on the database.
    latestSnapshot = imageBuffer;
    latestSnapshotTime = Date.now();
    latestDeviceId = clientDeviceId || latestDeviceId;

    // Background persistence (fire-and-forget): only matters for surviving
    // a Vercel cold start between pushes. Errors here must never affect
    // the response already sent to the ESP32.
    if (isDbAvailable()) {
      persistSnapshotInBackground(imageBuffer, clientDeviceId);
    }

    return NextResponse.json({ ok: true, size: imageBuffer.length });
  } catch (error) {
    console.error("Snapshot upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

async function persistSnapshotInBackground(imageBuffer: Buffer, clientDeviceId?: string) {
  try {
    let devices = await findDeviceId(clientDeviceId);
    if (devices.length === 0 && clientDeviceId) {
      devices = await findDeviceId(undefined);
    }
    if (devices.length === 0) {
      const created = await query<{ id: string }>(
        `INSERT INTO esp32_devices (pin, firmware_version, is_online, last_seen)
         VALUES ($1, '1.0.0-push', true, now())
         RETURNING id`,
        [clientDeviceId || "ESP32PUSH"]
      );
      devices = created;
    }

    const deviceId = devices[0].id;
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

export async function GET() {
  try {
    // Hot path: serve straight from memory whenever we have it.
    if (latestSnapshot) {
      return respondWithSnapshot(latestSnapshot, latestSnapshotTime);
    }

    // Memory is empty (fresh serverless cold start) — fall back to the DB
    // so a Vercel deployment can still recover the last known frame.
    if (isDbAvailable()) {
      const device = await query<{ latest_snapshot: string | null; latest_snapshot_at: string | null }>(
        `SELECT latest_snapshot, latest_snapshot_at
         FROM esp32_devices
         WHERE latest_snapshot IS NOT NULL
         ORDER BY latest_snapshot_at DESC NULLS LAST
         LIMIT 1`,
        []
      );

      if (device.length > 0 && device[0].latest_snapshot) {
        const buffer = Buffer.from(device[0].latest_snapshot, "base64");
        const snapshotTime = device[0].latest_snapshot_at
          ? new Date(device[0].latest_snapshot_at).getTime()
          : 0;
        // Warm the in-memory cache so subsequent polls skip the DB entirely.
        latestSnapshot = buffer;
        latestSnapshotTime = snapshotTime;
        return respondWithSnapshot(buffer, snapshotTime);
      }
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
      },
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Snapshot-Time": snapshotTime.toString(),
      "X-Snapshot-Age": `${Math.round((Date.now() - snapshotTime) / 1000)}s`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
