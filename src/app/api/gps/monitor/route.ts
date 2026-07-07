import { NextRequest, NextResponse } from "next/server";
import { query, isDbAvailable } from "@/lib/db";

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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      catId,
      deviceId,
      latitude,
      longitude,
      homeLatitude,
      homeLongitude,
      radiusMeters = 80,
      accuracyM = 3,
      speedKmh,
    } = body;

    if (!catId || !deviceId) {
      return NextResponse.json({ error: "Missing catId or deviceId." }, { status: 400 });
    }

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

    await query(
      `INSERT INTO gps_logs (cat_id, device_id, latitude, longitude, accuracy_m, speed_kmh, zone_label)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [catId, deviceId, latitude, longitude, accuracyM, speedKmh || null, inside ? "Home" : "Away"]
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
