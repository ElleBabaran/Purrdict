import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient, PURRDICT_TASK_QUEUE } from "@/temporal/client";

/**
 * POST /api/reminders/schedule
 * Schedules a reminder check via Temporal workflow.
 * Body: { reminderId: string, checkIntervalMs?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderId, checkIntervalMs = 60000 } = body;

    if (!reminderId || typeof reminderId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid reminderId." },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();

    const handle = await client.workflow.start("reminderSchedulerWorkflow", {
      args: [{ reminderId, checkIntervalMs }],
      taskQueue: PURRDICT_TASK_QUEUE,
      workflowId: `reminder-${reminderId}`,
    });

    return NextResponse.json({
      success: true,
      workflowId: handle.workflowId,
    });
  } catch (error) {
    console.error("Reminder schedule error:", error);
    return NextResponse.json(
      { error: "Failed to schedule reminder." },
      { status: 500 }
    );
  }
}
