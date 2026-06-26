import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient, PURRDICT_TASK_QUEUE } from "@/temporal/client";

/**
 * POST /api/esp32/pair
 * Starts the ESP32 pairing workflow via Temporal.
 * Body: { pin: string, ownerId: string, catId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, ownerId, catId } = body;

    // Input validation (Aikido Zen also protects against injection here)
    if (!pin || typeof pin !== "string" || pin.length !== 6) {
      return NextResponse.json(
        { error: "Invalid PIN. Must be exactly 6 characters." },
        { status: 400 }
      );
    }
    if (!ownerId || !catId) {
      return NextResponse.json(
        { error: "Missing ownerId or catId." },
        { status: 400 }
      );
    }

    // Sanitize PIN — alphanumeric only
    if (!/^[A-Za-z0-9]{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be alphanumeric." },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();

    // Start the durable pairing workflow
    const handle = await client.workflow.start("pairEsp32Workflow", {
      args: [{ pin: pin.toUpperCase(), ownerId, catId }],
      taskQueue: PURRDICT_TASK_QUEUE,
      workflowId: `pair-esp32-${ownerId}-${pin}`,
    });

    // Wait for result (this is a short workflow, ~5s)
    const result = await handle.result();

    if (result.success) {
      return NextResponse.json({ success: true, deviceId: result.deviceId });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }
  } catch (error) {
    console.error("ESP32 pair error:", error);
    return NextResponse.json(
      { error: "Failed to start pairing workflow." },
      { status: 500 }
    );
  }
}
