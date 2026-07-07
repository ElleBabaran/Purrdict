import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, isDbAvailable } from "@/lib/db";
import { timingSafeStringEqual } from "@/lib/oauth";

/**
 * Haversine distance in meters between two lat/lng points.
 */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * POST /api/gps/monitor
 * Logs a single GPS reading for a cat and checks it against the home geofence.
 * Body: { catId, deviceId, latitude, longitude, homeLatitude, homeLongitude, radiusMeters?, accuracyM?, speedKmh? }
 * Header: X-Device-Secret: <secret returned by POST /api/esp32/pair>
 *
 * Missing Authentication fix: this endpoint previously accepted a
 * `catId`/`deviceId` pair with no credential check at all — anyone could
 * insert forged GPS history for any cat by guessing or enumerating its
 * UUID. It now requires the same per-device secret used by
 * /api/esp32/data and /api/esp32/snapshot (issued at pairing time), and
 * the cat_id is taken from the authenticated device's own `cat_id`
 * column rather than trusted from the request body — so a device can
 * only ever log GPS points for the cat it's actually paired to.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deviceId: clientDeviceId,
      latitude,
      longitude,
      homeLatitude,
      homeLongitude,
      radiusMeters = 80,
      accuracyM = 3,
      speedKmh,
    } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof homeLatitude !== "number" ||
      typeof homeLongitude !== "number"
    ) {
      return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
    }

    const distanceMeters = Math.round(
      haversineMeters(latitude, longitude, homeLatitude, homeLongitude)
    );
    const inside = distanceMeters <= radiusMeters;

    if (!isDbAvailable()) {
      return NextResponse.json({
        success: true,
        mode: "demo",
        inside,
        distanceMeters,
      });
    }

    const deviceSecret = request.headers.get("x-device-secret");
    if (!clientDeviceId || !deviceSecret) {
      return NextResponse.json(
        { error: "Missing deviceId or X-Device-Secret header. Pair the device first via /api/esp32/pair." },
        { status: 401 }
      );
    }

    const device = await queryOne<{ id: string; cat_id: string | null; device_secret: string | null }>(
      "SELECT id, cat_id, device_secret FROM esp32_devices WHERE id::text = $1 OR pin = $1 LIMIT 1",
      [clientDeviceId]
    );
    if (!device || !device.device_secret || !timingSafeStringEqual(deviceSecret, device.device_secret)) {
      return NextResponse.json({ error: "Invalid device credentials." }, { status: 401 });
    }
    if (!device.cat_id) {
      return NextResponse.json({ error: "Device is not paired to a cat." }, { status: 409 });
    }

    await query(
      `INSERT INTO gps_logs (cat_id, device_id, latitude, longitude, accuracy_m, speed_kmh, zone_label)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [device.cat_id, device.id, latitude, longitude, accuracyM, speedKmh || null, inside ? "Home" : "Away"]
    );

    return NextResponse.json({
      success: true,
      inside,
      distanceMeters,
    });
  } catch (error) {
    console.error("GPS monitor error:", error);
    return NextResponse.json({ error: "Failed to log GPS reading." }, { status: 500 });
  }
}
