import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, queryOne } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "purrdict-dev-secret-change-in-prod";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (typeof displayName !== "string" || displayName.length < 1) {
      return NextResponse.json({ error: "Display name is required." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await queryOne("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const rows = await query<{ id: string; email: string; display_name: string }>(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name`,
      [email.toLowerCase(), passwordHash, displayName]
    );

    const user = rows[0];

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
        cats: [],
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
