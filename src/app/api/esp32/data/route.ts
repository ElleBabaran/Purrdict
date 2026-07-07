import { NextRequest, NextResponse } from "next/server";
import { isDbAvailable, query, queryOne } from "@/lib/db";
import { deriveEmotionScores } from "@/lib/emotion";
import { timingSafeStringEqual } from "@/lib/oauth";
import { getUserId } from "@/lib/auth";

/**
 * POST /api/esp32/data
 *
 * Endpoint for a *paired* ESP32 device to POST raw sensor data.
 * Header: X-Device-Secret: <secret returned by POST /api/esp32/pair>
 *
 * Improper Access Control / Missing Authentication fix: this endpoint
 * previously accepted data from anyone with no credential — a missing
 * or unrecognized deviceId silently fell through to "grab the first
 * device in the system" and, if none existed yet, auto-created a brand
 * new device and linked it to "the first cat in the system" found by a
 * bare `SELECT id FROM cats LIMIT 1`. That meant any unauthenticated
 * request could inject fabricated behavior/emotion/sensor rows for
 * someone else's cat, and in a multi-tenant deployment could silently
 * attach a stranger's hardware to whichever cat happened to be first in
 * the table. A device must now be explicitly paired first
 * (POST /api/esp32/pair, which requires the owner's JWT) and present
 * the secret issued at pairing time on every request here.
 *
 * Body (JSON):
 * {
 *   deviceId: string,         // required: the esp32_devices.id from pairing
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

      // Log emotion assessment derived from this behavior + motion reading
      // (Nicholson & O'Carroll 2021 ethogram — see src/lib/emotion.ts)
      const emotion = deriveEmotionScores(behavior, motionIntensity);
      await query(
        `INSERT INTO emotion_assessments
         (cat_id, fear_score, anger_score, joy_score, contentment_score, interest_score,
          body_posture, tail_position, ear_orientation, eye_state, vocalization, research_ref)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          catId,
          emotion.fearScore, emotion.angerScore, emotion.joyScore,
          emotion.contentmentScore, emotion.interestScore,
          emotion.bodyPosture, emotion.tailPosition, emotion.earOrientation,
          emotion.eyeState, emotion.vocalization, "nicholson2021",
        ]
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
 *
 * Improper Access Control fix: this previously had no authentication and
 * no ownership check at all — it queried `sensor_readings`,
 * `behavior_events`, `emotion_assessments`, and `esp32_devices` globally
 * (just "the most recent rows across the whole table"), so any caller,
 * logged in or not, could read the single most-recently-active cat's
 * behavior/emotion/device data regardless of who owned it. `catId` is
 * now required and every query is scoped to a cat verified to belong to
 * the authenticated user.
 */
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const catId = searchParams.get("catId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);

    if (!catId) {
      return NextResponse.json({ error: "catId is required." }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ readings: [], behaviors: [], mode: "demo" });
    }

    const cat = await queryOne<{ id: string }>(
      "SELECT id FROM cats WHERE id = $1 AND owner_id = $2",
      [catId, userId]
    );
    if (!cat) {
      return NextResponse.json({ error: "Cat not found for this account." }, { status: 404 });
    }

    // Get latest sensor readings for this cat
    const readings = await query(
      `SELECT motion, motion_intensity, distance_cm, temperature_c, humidity_pct, 
              free_heap, uptime_secs, rssi, recorded_at
       FROM sensor_readings 
       WHERE cat_id = $1
       ORDER BY recorded_at DESC 
       LIMIT $2`,
      [catId, limit]
    );

    // Get latest behavior events for this cat
    const behaviors = await query(
      `SELECT behavior, confidence, emoji, description, research_ref, odba, recorded_at
       FROM behavior_events 
       WHERE cat_id = $1
       ORDER BY recorded_at DESC 
       LIMIT $2`,
      [catId, limit]
    );

    // Get the most recent emotion assessment for this cat (DB-backed,
    // written alongside each behavior event — see POST handler above)
    const emotions = await query(
      `SELECT fear_score, anger_score, joy_score, contentment_score, interest_score,
              body_posture, tail_position, ear_orientation, eye_state, vocalization,
              research_ref, recorded_at
       FROM emotion_assessments
       WHERE cat_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [catId]
    );

    // Get status for the device(s) linked to this cat
    const devices = await query(
      `SELECT id, pin, is_online, last_seen, battery_pct, ip_address
       FROM esp32_devices 
       WHERE cat_id = $1
       ORDER BY last_seen DESC NULLS LAST
       LIMIT 1`,
      [catId]
    );

    return NextResponse.json({
      readings,
      behaviors,
      emotion: emotions[0] || null,
      device: devices[0] || null,
    });
  } catch (error) {
    console.error("ESP32 data fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
