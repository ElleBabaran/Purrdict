/**
 * Temporal Workflows — durable, fault-tolerant orchestrations.
 * These survive server restarts and can run for days/weeks.
 *
 * Workflows CANNOT import non-deterministic code directly.
 * They call Activities (which do the actual I/O) via proxyActivities.
 */

import { proxyActivities, sleep } from "@temporalio/workflow";
import type * as activities from "./activities";

// Proxy activities with retry policies
const {
  verifyEsp32Pin,
  claimEsp32Device,
  checkReminderDue,
  markReminderDone,
  createRecurringReminder,
  logBehaviorEvent,
  logGpsCoordinate,
  checkGeofence,
  saveCamClip,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
  retry: {
    maximumAttempts: 5,
    initialInterval: "1 second",
    backoffCoefficient: 2,
  },
});

// ══════════════════════════════════════════════════════════
// WORKFLOW: Pair ESP32 Device
// Retries connection up to 5 times with exponential backoff.
// Once verified, claims the device for the user+cat.
// ══════════════════════════════════════════════════════════
export async function pairEsp32Workflow(params: {
  pin: string;
  ownerId: string;
  catId: string;
}): Promise<{ success: boolean; deviceId?: string; error?: string }> {
  // Step 1: Verify the PIN
  const verification = await verifyEsp32Pin(params.pin);

  if (!verification.valid) {
    return { success: false, error: "Invalid PIN. Device not found." };
  }

  // Step 2: Claim the device
  const claimed = await claimEsp32Device(
    verification.deviceId!,
    params.ownerId,
    params.catId
  );

  if (!claimed) {
    return { success: false, error: "Failed to claim device. It may already be paired." };
  }

  return { success: true, deviceId: verification.deviceId };
}

// ══════════════════════════════════════════════════════════
// WORKFLOW: Reminder Scheduler
// Runs on a schedule, checks if reminder is due, sends notification,
// and auto-creates the next occurrence for recurring reminders.
// ══════════════════════════════════════════════════════════
export async function reminderSchedulerWorkflow(params: {
  reminderId: string;
  checkIntervalMs: number;
}): Promise<void> {
  // Check periodically if the reminder is due
  const result = await checkReminderDue(params.reminderId);

  if (result.isDue) {
    // Mark as done
    await markReminderDone(params.reminderId);

    // If recurring, create the next one
    const nextId = await createRecurringReminder(params.reminderId);

    if (nextId) {
      // Wait for the interval then check the next one
      await sleep(params.checkIntervalMs);
      // In production, this would schedule a new workflow for nextId
    }
  }
}

// ══════════════════════════════════════════════════════════
// WORKFLOW: GPS Monitoring
// Continuously logs GPS and checks geofence. Sends alert if cat
// leaves the safe zone. Runs for the duration of a session.
// ══════════════════════════════════════════════════════════
export async function gpsMonitoringWorkflow(params: {
  catId: string;
  deviceId: string;
  homeLatitude: number;
  homeLongitude: number;
  radiusMeters: number;
  pollingIntervalMs: number;
  durationMs: number;
}): Promise<{ totalLogs: number; leftGeofence: boolean }> {
  let totalLogs = 0;
  let leftGeofence = false;
  const startTime = Date.now();

  while (Date.now() - startTime < params.durationMs) {
    // In production, this would read from an ESP32 data stream.
    // Here we simulate with a fixed coordinate.
    const lat = params.homeLatitude + (Math.random() - 0.5) * 0.001;
    const lng = params.homeLongitude + (Math.random() - 0.5) * 0.001;

    // Log the GPS point
    await logGpsCoordinate({
      catId: params.catId,
      deviceId: params.deviceId,
      latitude: lat,
      longitude: lng,
      accuracyM: 3,
      zoneLabel: "Home",
    });
    totalLogs++;

    // Check geofence
    const fence = await checkGeofence({
      latitude: lat,
      longitude: lng,
      homeLatitude: params.homeLatitude,
      homeLongitude: params.homeLongitude,
      radiusMeters: params.radiusMeters,
    });

    if (!fence.inside) {
      leftGeofence = true;
      // In production: trigger push notification
    }

    await sleep(params.pollingIntervalMs);
  }

  return { totalLogs, leftGeofence };
}

// ══════════════════════════════════════════════════════════
// WORKFLOW: Behavior Analysis Pipeline
// Processes sensor data, classifies behavior, logs it, and
// auto-saves cam clips on interesting events.
// ══════════════════════════════════════════════════════════
export async function behaviorAnalysisWorkflow(params: {
  catId: string;
  deviceId: string;
  behavior: string;
  confidence: number;
  emoji: string;
  description: string;
  shouldClip: boolean;
}): Promise<{ logged: boolean; clipSaved: boolean }> {
  // Step 1: Log the behavior event
  const logged = await logBehaviorEvent({
    catId: params.catId,
    deviceId: params.deviceId,
    behavior: params.behavior,
    confidence: params.confidence,
    emoji: params.emoji,
    description: params.description,
  });

  let clipSaved = false;

  // Step 2: If the event is interesting enough, auto-save a clip
  if (params.shouldClip && params.confidence > 0.8) {
    clipSaved = await saveCamClip({
      catId: params.catId,
      deviceId: params.deviceId,
      caption: params.description,
      emoji: params.emoji,
    });
  }

  return { logged, clipSaved };
}
