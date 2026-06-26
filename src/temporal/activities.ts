/**
 * Temporal Activities — side-effectful functions that workflows orchestrate.
 * Uses raw PostgreSQL via the pg pool.
 */

import { query, queryOne } from "@/lib/db";

// ── ESP32 Pairing ──
export async function verifyEsp32Pin(pin: string): Promise<{
  valid: boolean;
  deviceId?: string;
  ipAddress?: string;
}> {
  const device = await queryOne<{ id: string; ip_address: string | null }>(
    "SELECT id, ip_address FROM esp32_devices WHERE pin = $1",
    [pin]
  );

  if (!device) return { valid: false };
  return { valid: true, deviceId: device.id, ipAddress: device.ip_address || undefined };
}

export async function claimEsp32Device(
  deviceId: string,
  ownerId: string,
  catId: string
): Promise<boolean> {
  const rows = await query(
    `UPDATE esp32_devices
     SET owner_id = $1, cat_id = $2, is_online = true, last_seen = now()
     WHERE id = $3
     RETURNING id`,
    [ownerId, catId, deviceId]
  );
  return rows.length > 0;
}

// ── Reminder Scheduling ──
export async function checkReminderDue(reminderId: string): Promise<{
  isDue: boolean;
  text: string;
  catName: string;
}> {
  const reminder = await queryOne<{ text: string; done: boolean; cat_id: string | null }>(
    "SELECT text, done, cat_id FROM reminders WHERE id = $1",
    [reminderId]
  );

  if (!reminder || reminder.done) return { isDue: false, text: "", catName: "" };

  let catName = "your cat";
  if (reminder.cat_id) {
    const cat = await queryOne<{ name: string }>(
      "SELECT name FROM cats WHERE id = $1",
      [reminder.cat_id]
    );
    if (cat) catName = cat.name;
  }

  return { isDue: true, text: reminder.text, catName };
}

export async function markReminderDone(reminderId: string): Promise<boolean> {
  const rows = await query(
    "UPDATE reminders SET done = true, updated_at = now() WHERE id = $1 RETURNING id",
    [reminderId]
  );
  return rows.length > 0;
}

export async function createRecurringReminder(reminderId: string): Promise<string | null> {
  const original = await queryOne<{
    owner_id: string; cat_id: string | null; text: string;
    priority: string; category: string; scheduled_time: string | null; recurring: string | null;
  }>(
    "SELECT owner_id, cat_id, text, priority, category, scheduled_time, recurring FROM reminders WHERE id = $1",
    [reminderId]
  );

  if (!original || !original.recurring) return null;

  const rows = await query<{ id: string }>(
    `INSERT INTO reminders (owner_id, cat_id, text, priority, category, scheduled_time, recurring)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [original.owner_id, original.cat_id, original.text, original.priority, original.category, original.scheduled_time, original.recurring]
  );

  return rows[0]?.id || null;
}

// ── Behavior Analysis (research-backed) ──
// Classification based on: Ikurior et al. 2023 (Sensors 23(16):7165)
export async function logBehaviorEvent(params: {
  catId: string;
  deviceId: string;
  behavior: string;
  confidence: number;
  emoji: string;
  description: string;
  accelXMean?: number;
  accelYMean?: number;
  accelZMean?: number;
  odba?: number;
  researchRef?: string;
}): Promise<boolean> {
  const rows = await query(
    `INSERT INTO behavior_events
     (cat_id, device_id, behavior, confidence, emoji, description, accel_x_mean, accel_y_mean, accel_z_mean, odba, research_ref)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      params.catId, params.deviceId, params.behavior, params.confidence,
      params.emoji, params.description,
      params.accelXMean || null, params.accelYMean || null, params.accelZMean || null,
      params.odba || null, params.researchRef || "ikurior2023",
    ]
  );
  return rows.length > 0;
}

// ── Emotion Assessment (research-backed) ──
// Based on: Nicholson & O'Carroll 2021 (Ir Vet J 74:8)
export async function logEmotionAssessment(params: {
  catId: string;
  fearScore: number;
  angerScore: number;
  joyScore: number;
  contentmentScore: number;
  interestScore: number;
  bodyPosture?: string;
  tailPosition?: string;
  earOrientation?: string;
  eyeState?: string;
  vocalization?: string;
}): Promise<boolean> {
  const rows = await query(
    `INSERT INTO emotion_assessments
     (cat_id, fear_score, anger_score, joy_score, contentment_score, interest_score,
      body_posture, tail_position, ear_orientation, eye_state, vocalization)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      params.catId, params.fearScore, params.angerScore, params.joyScore,
      params.contentmentScore, params.interestScore,
      params.bodyPosture || null, params.tailPosition || null,
      params.earOrientation || null, params.eyeState || null,
      params.vocalization || null,
    ]
  );
  return rows.length > 0;
}

// ── GPS Logging ──
export async function logGpsCoordinate(params: {
  catId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracyM: number;
  altitudeM?: number;
  speedKmh?: number;
  zoneLabel?: string;
}): Promise<boolean> {
  const rows = await query(
    `INSERT INTO gps_logs (cat_id, device_id, latitude, longitude, accuracy_m, altitude_m, speed_kmh, zone_label)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [params.catId, params.deviceId, params.latitude, params.longitude, params.accuracyM, params.altitudeM || null, params.speedKmh || null, params.zoneLabel || null]
  );
  return rows.length > 0;
}

// ── Geofence Check ──
export async function checkGeofence(params: {
  latitude: number;
  longitude: number;
  homeLatitude: number;
  homeLongitude: number;
  radiusMeters: number;
}): Promise<{ inside: boolean; distanceMeters: number }> {
  // Haversine formula
  const R = 6371000;
  const dLat = ((params.latitude - params.homeLatitude) * Math.PI) / 180;
  const dLon = ((params.longitude - params.homeLongitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((params.homeLatitude * Math.PI) / 180) *
      Math.cos((params.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return { inside: distance <= params.radiusMeters, distanceMeters: Math.round(distance) };
}

// ── Cam Clip Save ──
export async function saveCamClip(params: {
  catId: string;
  deviceId: string;
  caption: string;
  emoji: string;
  triggerType?: string;
  mediaUrl?: string;
  durationSecs?: number;
}): Promise<boolean> {
  const rows = await query(
    `INSERT INTO cam_clips (cat_id, device_id, caption, emoji, trigger_type, media_url, duration_secs)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [params.catId, params.deviceId, params.caption, params.emoji, params.triggerType || "motion", params.mediaUrl || null, params.durationSecs || null]
  );
  return rows.length > 0;
}
