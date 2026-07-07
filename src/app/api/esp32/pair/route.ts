import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query, queryOne, isDbAvailable } from "@/lib/db";
import { getUserId } from "@/lib/auth";

/**
 * POST /api/esp32/pair
 *
 * Verifies a device PIN and claims it for the authenticated user's cat.
 * Body: { pin: string, catId: string }
 * Header: Authorization: Bearer <JWT>
 *
 * Improper Access Control fix: this previously accepted an `ownerId` in
 * the request body with no verification that the caller actually was
 * that owner — anyone who knew (or enumerated) another user's UUID plus
 * a valid device PIN could claim that device onto their own account. The
 * owner is now derived from the caller's JWT, the same way every other
 * authenticated route in this app resolves identity, and the target cat
 * must belong to that same user.
 *
 * Also generates a per-device secret here (see sql/006_device_secret.sql)
 * — returned once in the response — which the firmware must send back
 * via the `X-Device-Secret` header on every POST to /api/esp32/data and
 * /api/esp32/snapshot. Without this, once a device's PIN was consumed by
 * pairing, nothing stopped a *different* unauthenticated sender from
 * posting sensor data or camera frames under that same device.
 */
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pin, catId } = body;

    // Input validation
    if (!pin || typeof pin !== "string" || pin.length !== 6) {
      return NextResponse.json(
        { error: "Invalid PIN. Must be exactly 6 characters." },
        { status: 400 }
      );
    }
    if (!catId || typeof catId !== "string") {
      return NextResponse.json({ error: "Missing catId." }, { status: 400 });
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
      return NextResponse.json({ success: true, deviceId: "demo-device", deviceSecret: "demo-secret" });
    }

    // Verify the target cat belongs to the authenticated user before
    // claiming any device onto it.
    const cat = await queryOne<{ id: string }>(
      "SELECT id FROM cats WHERE id = $1 AND owner_id = $2",
      [catId, userId]
    );
    if (!cat) {
      return NextResponse.json({ error: "Cat not found for this account." }, { status: 404 });
    }

    // Step 1: Verify the PIN exists
    const device = await queryOne<{ id: string; owner_id: string | null }>(
      "SELECT id, owner_id FROM esp32_devices WHERE pin = $1",
      [normalizedPin]
    );

    if (!device) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN. Device not found." },
        { status: 404 }
      );
    }

    // A device already claimed by a different user can't be re-paired
    // out from under them just by knowing the PIN.
    if (device.owner_id && device.owner_id !== userId) {
      return NextResponse.json(
        { success: false, error: "This device is already paired to another account." },
        { status: 409 }
      );
    }

    const deviceSecret = crypto.randomBytes(24).toString("hex");

    // Step 2: Claim the device for this owner + cat, issuing a fresh secret
    const claimed = await query(
      `UPDATE esp32_devices
       SET owner_id = $1, cat_id = $2, device_secret = $3, is_online = true, last_seen = now()
       WHERE id = $4
       RETURNING id`,
      [userId, catId, deviceSecret, device.id]
    );

    if (claimed.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to claim device. It may already be paired." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, deviceId: device.id, deviceSecret });
  } catch (error) {
    console.error("ESP32 pair error:", error);
    return NextResponse.json(
      { error: "Failed to pair device." },
      { status: 500 }
    );
  }
}
