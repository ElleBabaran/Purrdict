import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable, query } from "@/lib/db";

/**
 * POST /api/esp32/data
 * 
 * Endpoint for ESP32 devices to POST raw sensor data.
 * No PIN system — the ESP32 posts directly. The server finds the
 * first available device/cat or creates a record on-the-fly.
 * 
 * Body (JSON):
 * {
 *   deviceId?: string,        // optional: MAC address or custom ID
 *   motion: boolean,          // motion detected in camera frame
 *   motionIntensity: number,  // 0-100 how much motion
 *   distance?: number,        // cm, from ultrasonic sensor (optional)
 *   temperature?: number,     // celsius (optional)
 *   humidity?: number,        // % (optional)
 *   freeHeap?: number,        // ESP32 free heap memory
 *   uptime?: number,          // seconds since boot
 *   rssi?: number,            // WiFi signal strength
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deviceId: clientDeviceId,
      motion = false,
      motionIntensity = 0,
      distance,
      temperature,
      humidity,
      freeHeap,
      uptime,
      rssi,
    } = body;

    if (!isDbAvailable()) {
      // Demo mode — just acknowledge
      return NextResponse.json({ ok: true, mode: "demo" });
    }

    // Find the first registered device (since no PIN system, just grab the first one)
    // If clientDeviceId (MAC address) is provided, try to match it
    let device;
    if (clientDeviceId) {
      const devices = await query<{ id: string; cat_id: string | null }>(
        "SELECT id, cat_id FROM esp32_devices WHERE id::text = $1 OR pin = $1 LIMIT 1",
        [clientDeviceId]
      );
      device = devices[0];
    }
    
    // Fallback: just get the first device in the system
    if (!device) {
      const devices = await query<{ id: string; cat_id: string | null }>(
        "SELECT id, cat_id FROM esp32_devices ORDER BY last_seen DESC NULLS LAST LIMIT 1",
        []
      );
      device = devices[0];
    }

    // If no device exists at all, create one on the fly
    if (!device) {
      const newDevices = await query<{ id: string; cat_id: string | null }>(
        `INSERT INTO esp32_devices (pin, firmware_version, is_online, last_seen)
         VALUES ($1, '1.0.0', true, now())
         RETURNING id, cat_id`,
        [clientDeviceId || "ESP32C"]
      );
      device = newDevices[0];

      // Also try to link it to the first cat that exists
      const cats = await query<{ id: string }>("SELECT id FROM cats LIMIT 1", []);
      if (cats[0] && device) {
        await query("UPDATE esp32_devices SET cat_id = $1 WHERE id = $2", [cats[0].id, device.id]);
        device.cat_id = cats[0].id;
      }
    }

    if (!device) {
      return NextResponse.json({ error: "No device or cat configured" }, { status: 500 });
    }

    const deviceId = device.id;
    const catId = device.cat_id;

    // Update device last_seen
    await query(
      "UPDATE esp32_devices SET last_seen = now(), is_online = true WHERE id = $1",
      [deviceId]
    );

    // Classify behavior based on motion intensity (research-backed thresholds)
    // Ikurior et al. 2023: ODBA thresholds for behavior classification
    let behavior = "resting";
    let confidence = 0.90;
    let emoji = "😴";
    let description = "Low motion — resting/sleeping pattern detected";

    if (motionIntensity > 80) {
      behavior = "running";
      confidence = 0.93;
      emoji = "⚡";
      description = "Very high motion intensity — running or zoomies detected";
    } else if (motionIntensity > 60) {
      behavior = "playing";
      confidence = 0.85;
      emoji = "🎯";
      description = "High motion with erratic pattern — playing behavior";
    } else if (motionIntensity > 40) {
      behavior = "walking";
      confidence = 0.92;
      emoji = "🚶";
      description = "Moderate periodic motion — walking gait detected";
    } else if (motionIntensity > 20) {
      behavior = "grooming";
      confidence = 0.89;
      emoji = "✨";
      description = "Rhythmic low-intensity motion — grooming pattern";
    } else if (motionIntensity > 5) {
      behavior = "sitting_alert";
      confidence = 0.90;
      emoji = "🪑";
      description = "Minimal motion, upright — sitting/alert posture";
    }

    // Log behavior event if we have a cat linked
    if (catId) {
      await query(
        `INSERT INTO behavior_events 
         (cat_id, device_id, behavior, confidence, emoji, description, research_ref, odba)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [catId, deviceId, behavior, confidence, emoji, description, "ikurior2023", motionIntensity / 100]
      );
    }

    // Store raw sensor reading
    await query(
      `INSERT INTO sensor_readings 
       (device_id, cat_id, motion, motion_intensity, distance_cm, temperature_c, humidity_pct, free_heap, uptime_secs, rssi)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [deviceId, catId, motion, motionIntensity, distance || null, temperature || null, humidity || null, freeHeap || null, uptime || null, rssi || null]
    );

    return NextResponse.json({
      ok: true,
      behavior,
      confidence,
      emoji,
    });
  } catch (error) {
    console.error("ESP32 data ingest error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * GET /api/esp32/data?catId=xxx&limit=50
 * 
 * Fetches recent sensor readings and behavior events for the dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catId = searchParams.get("catId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!isDbAvailable()) {
      return NextResponse.json({ readings: [], behaviors: [], mode: "demo" });
    }

    // Get latest sensor readings
    const readings = await query(
      `SELECT motion, motion_intensity, distance_cm, temperature_c, humidity_pct, 
              free_heap, uptime_secs, rssi, recorded_at
       FROM sensor_readings 
       ORDER BY recorded_at DESC 
       LIMIT $1`,
      [limit]
    );

    // Get latest behavior events
    const behaviors = await query(
      `SELECT behavior, confidence, emoji, description, research_ref, odba, recorded_at
       FROM behavior_events 
       ORDER BY recorded_at DESC 
       LIMIT $1`,
      [limit]
    );

    // Get device status
    const devices = await query(
      `SELECT id, pin, is_online, last_seen, battery_pct, ip_address
       FROM esp32_devices 
       ORDER BY last_seen DESC NULLS LAST
       LIMIT 1`,
      []
    );

    return NextResponse.json({
      readings,
      behaviors,
      device: devices[0] || null,
    });
  } catch (error) {
    console.error("ESP32 data fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
