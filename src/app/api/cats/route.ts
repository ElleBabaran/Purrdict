import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "purrdict-dev-secret-change-in-prod";

function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// POST /api/cats — Create a new cat
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, emoji, breed, color, ageMonths, esp32Pin } = body;

    if (!name || !esp32Pin) {
      return NextResponse.json({ error: "Name and ESP32 PIN are required." }, { status: 400 });
    }

    // Sanitize PIN
    if (typeof esp32Pin !== "string" || !/^[A-Za-z0-9]{6}$/.test(esp32Pin)) {
      return NextResponse.json({ error: "PIN must be 6 alphanumeric characters." }, { status: 400 });
    }

    const rows = await query<{ id: string }>(
      `INSERT INTO cats (owner_id, name, emoji, breed, fur_color, age_months, esp32_pin, esp32_connected)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id`,
      [userId, name, emoji || "🐱", breed || "Unknown", color || "#F5A623", ageMonths || null, esp32Pin.toUpperCase()]
    );

    return NextResponse.json({ id: rows[0].id, success: true });
  } catch (error) {
    console.error("Create cat error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// GET /api/cats — List user's cats
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const cats = await query(
      "SELECT * FROM cats WHERE owner_id = $1 ORDER BY created_at",
      [userId]
    );
    return NextResponse.json({ cats });
  } catch (error) {
    console.error("List cats error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
