import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient, PURRDICT_TASK_QUEUE } from "@/temporal/client";

/**
 * POST /api/gps/monitor
 * Starts a GPS monitoring session via Temporal workflow.
 * Runs for a set duration, logging GPS and checking geofence.
 * Body: { catId, deviceId, homeLatitude, homeLongitude, radiusMeters?, pollingIntervalMs?, durationMs? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      catId,
      deviceId,
      homeLatitude,
      homeLongitude,
      radiusMeters = 100,
      pollingIntervalMs = 10000,
      durationMs = 3600000, // 1 hour default
    } = body;

    if (!catId || !deviceId) {
      return NextResponse.json(
        { error: "Missing catId or deviceId." },
        { status: 400 }
      );
    }

    if (typeof homeLatitude !== "number" || typeof homeLongitude !== "number") {
      return NextResponse.json(
        { error: "Invalid coordinates." },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();

    const handle = await client.workflow.start("gpsMonitoringWorkflow", {
      args: [{
        catId,
        deviceId,
        homeLatitude,
        homeLongitude,
        radiusMeters,
        pollingIntervalMs,
        durationMs,
      }],
      taskQueue: PURRDICT_TASK_QUEUE,
      workflowId: `gps-monitor-${catId}-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      workflowId: handle.workflowId,
    });
  } catch (error) {
    console.error("GPS monitor error:", error);
    return NextResponse.json(
      { error: "Failed to start GPS monitoring." },
      { status: 500 }
    );
  }
}
