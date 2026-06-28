import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, queryOne, isDbAvailable } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "purrdict-dev-secret-change-in-prod";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Demo mode — no DB configured
    if (!isDbAvailable()) {
      const token = jwt.sign(
        { userId: "demo-" + Date.now(), email: email.toLowerCase() },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return NextResponse.json({
        user: {
          id: "demo-" + Date.now(),
          email: email.toLowerCase(),
          displayName: email.split("@")[0],
          cats: [],
        },
        token,
      });
    }

    // Find user
    const user = await queryOne<{
      id: string;
      email: string;
      password_hash: string;
      display_name: string;
    }>("SELECT id, email, password_hash, display_name FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Load cats
    const cats = await query<{
      id: string;
      name: string;
      emoji: string;
      breed: string;
      fur_color: string;
      age_months: number | null;
      photo_url: string | null;
      esp32_pin: string;
      esp32_connected: boolean;
    }>("SELECT * FROM cats WHERE owner_id = $1 ORDER BY created_at", [user.id]);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        cats: cats.map((c) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          breed: c.breed,
          color: c.fur_color,
          ageMonths: c.age_months,
          photo: c.photo_url || undefined,
          esp32Pin: c.esp32_pin,
          esp32Connected: c.esp32_connected,
        })),
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
