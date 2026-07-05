import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/esp32/snapshot
 * ESP32 uploads a JPEG snapshot (binary body).
 * We store it in memory (latest frame only).
 * 
 * GET /api/esp32/snapshot
 * Returns the latest JPEG snapshot as an image.
 */

// Store latest snapshot in memory (serverless: per-instance, resets on cold start)
// For production you'd use R2/S3, but for demo this works.
let latestSnapshot: Buffer | null = null;
let lastSnapshotTime: number = 0;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    let imageBuffer: Buffer;

    if (contentType.includes("image/jpeg") || contentType.includes("application/octet-stream")) {
      // Binary JPEG upload
      const arrayBuffer = await request.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      // Base64 JSON upload
      const body = await request.json();
      if (!body.image) {
        return NextResponse.json({ error: "Missing image field" }, { status: 400 });
      }
      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = body.image.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      // Try as raw binary
      const arrayBuffer = await request.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    if (imageBuffer.length < 100) {
      return NextResponse.json({ error: "Image too small" }, { status: 400 });
    }

    latestSnapshot = imageBuffer;
    lastSnapshotTime = Date.now();

    return NextResponse.json({ ok: true, size: imageBuffer.length });
  } catch (error) {
    console.error("Snapshot upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  if (!latestSnapshot || Date.now() - lastSnapshotTime > 30000) {
    // No snapshot or older than 30s — return a 1x1 transparent pixel
    const pixel = Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsM" +
      "DhEQDg4RDgwSExQVFBMUFRkZGx0dHR8fJCQkJCQkJCT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQU" +
      "FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFAAB" +
      "AAAAAAAAAAAAAAAAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAU" +
      "EQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Snapshot-Age": "none",
      },
    });
  }

  return new NextResponse(latestSnapshot, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Snapshot-Time": lastSnapshotTime.toString(),
      "X-Snapshot-Age": `${Math.round((Date.now() - lastSnapshotTime) / 1000)}s`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
