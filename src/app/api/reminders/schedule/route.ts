import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, isDbAvailable } from "@/lib/db";

/**
 * POST /api/reminders/schedule
 * Checks whether a reminder is currently due; if so, marks it done
 * and — if it's a recurring reminder — creates the next occurrence.
 * Body: { reminderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderId } = body;

    if (!reminderId || typeof reminderId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid reminderId." },
        { status: 400 }
      );
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ success: true, isDue: false, mode: "demo" });
    }

    const reminder = await queryOne<{
      text: string;
      done: boolean;
      cat_id: string | null;
      owner_id: string;
      priority: string;
      category: string;
      scheduled_time: string | null;
      recurring: string | null;
    }>(
      "SELECT text, done, cat_id, owner_id, priority, category, scheduled_time, recurring FROM reminders WHERE id = $1",
      [reminderId]
    );

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
    }

    // A reminder is "due" once its scheduled_time has passed and it isn't done yet.
    const isDue =
      !reminder.done &&
      (!reminder.scheduled_time || new Date(reminder.scheduled_time) <= new Date());

    if (!isDue) {
      return NextResponse.json({ success: true, isDue: false });
    }

    // Mark it done
    await query(
      "UPDATE reminders SET done = true, updated_at = now() WHERE id = $1",
      [reminderId]
    );

    // If recurring, create the next occurrence
    let nextReminderId: string | null = null;
    if (reminder.recurring) {
      const rows = await query<{ id: string }>(
        `INSERT INTO reminders (owner_id, cat_id, text, priority, category, scheduled_time, recurring)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          reminder.owner_id,
          reminder.cat_id,
          reminder.text,
          reminder.priority,
          reminder.category,
          reminder.scheduled_time,
          reminder.recurring,
        ]
      );
      nextReminderId = rows[0]?.id || null;
    }

    return NextResponse.json({
      success: true,
      isDue: true,
      nextReminderId,
    });
  } catch (error) {
    console.error("Reminder schedule error:", error);
    return NextResponse.json(
      { error: "Failed to process reminder." },
      { status: 500 }
    );
  }
}
