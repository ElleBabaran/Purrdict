import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, isDbAvailable } from "@/lib/db";

/**
 * POST /api/esp32/pair
 * Verifies a device PIN and claims it for the given owner/cat.
 * Body: { pin: string, ownerId: string, catId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, ownerId, catId } = body;

    // Input validation
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

    const normalizedPin = pin.toUpperCase();

    if (!isDbAvailable()) {
      // Demo mode — pretend pairing succeeded
      return NextResponse.json({ success: true, deviceId: "demo-device" });
    }

    // Step 1: Verify the PIN exists
    const device = await queryOne<{ id: string }>(
      "SELECT id FROM esp32_devices WHERE pin = $1",
      [normalizedPin]
    );

    if (!device) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN. Device not found." },
        { status: 404 }
      );
    }

    // Step 2: Claim the device for this owner + cat
    const claimed = await query(
      `UPDATE esp32_devices
       SET owner_id = $1, cat_id = $2, is_online = true, last_seen = now()
       WHERE id = $3
       RETURNING id`,
      [ownerId, catId, device.id]
    );

    if (claimed.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to claim device. It may already be paired." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, deviceId: device.id });
  } catch (error) {
    console.error("ESP32 pair error:", error);
    return NextResponse.json(
      { error: "Failed to pair device." },
      { status: 500 }
    );
  }
}
