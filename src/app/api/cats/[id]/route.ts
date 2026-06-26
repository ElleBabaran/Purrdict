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

// PATCH /api/cats/[id] — Update a cat
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  try {
    // Build SET clause dynamically from allowed fields
    const allowed: Record<string, string> = {
      name: "name",
      breed: "breed",
      color: "fur_color",
      emoji: "emoji",
      ageMonths: "age_months",
      photo: "photo_url",
      esp32Pin: "esp32_pin",
      esp32Connected: "esp32_connected",
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    for (const [jsKey, dbCol] of Object.entries(allowed)) {
      if (body[jsKey] !== undefined) {
        sets.push(`${dbCol} = $${paramIdx}`);
        values.push(body[jsKey]);
        paramIdx++;
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    sets.push(`updated_at = now()`);
    values.push(id, userId);

    const rows = await query(
      `UPDATE cats SET ${sets.join(", ")} WHERE id = $${paramIdx} AND owner_id = $${paramIdx + 1} RETURNING id`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Cat not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update cat error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/cats/[id] — Delete a cat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  try {
    const rows = await query(
      "DELETE FROM cats WHERE id = $1 AND owner_id = $2 RETURNING id",
      [id, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Cat not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete cat error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
