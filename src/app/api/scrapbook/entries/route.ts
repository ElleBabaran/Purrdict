import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { query, isDbAvailable } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "purrdict-dev-secret-change-in-prod";

// Allow larger request bodies for media uploads (50MB)
export const maxDuration = 60;

// Max file size: 50MB in base64
const MAX_MEDIA_SIZE = 50 * 1024 * 1024 * 1.37; // ~68.5MB base64 for 50MB file

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

// GET /api/scrapbook/entries?bookId=xxx — List entries for a book
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required." }, { status: 400 });
  }

  if (!isDbAvailable()) {
    return NextResponse.json({ entries: [] });
  }

  try {
    const entries = await query(
      `SELECT e.id, e.type, e.title, e.body, e.emoji, e.tag, e.media_url, e.media_data, e.created_at
       FROM scrapbook_entries e
       JOIN scrapbook_books b ON e.book_id = b.id
       WHERE e.book_id = $1 AND b.owner_id = $2
       ORDER BY e.created_at DESC`,
      [bookId, userId]
    );
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("List scrapbook entries error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/scrapbook/entries — Create a new entry (with optional media)
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookId, type, title, entryBody, tag, mediaData } = body;

    if (!bookId || !title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "bookId and title are required." }, { status: 400 });
    }

    if (!["photo", "video", "note"].includes(type)) {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    // Validate media size
    if (mediaData && mediaData.length > MAX_MEDIA_SIZE) {
      return NextResponse.json({ error: "File too large. Max 50MB." }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ id: "demo-entry-" + Date.now(), success: true });
    }

    // Verify book belongs to user
    const bookCheck = await query(
      "SELECT id FROM scrapbook_books WHERE id = $1 AND owner_id = $2",
      [bookId, userId]
    );
    if (bookCheck.length === 0) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    // Get user's first cat (for cat_id FK requirement)
    const cats = await query<{ id: string }>(
      "SELECT id FROM cats WHERE owner_id = $1 LIMIT 1",
      [userId]
    );
    const catId = cats[0]?.id || null;

    const rows = await query<{ id: string; created_at: string }>(
      `INSERT INTO scrapbook_entries (owner_id, cat_id, book_id, type, title, body, emoji, tag, media_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        userId,
        catId,
        bookId,
        type || "note",
        title.trim(),
        entryBody || null,
        type === "photo" ? "📷" : type === "video" ? "🎬" : "📝",
        tag || null,
        mediaData || null,
      ]
    );

    return NextResponse.json({ id: rows[0].id, createdAt: rows[0].created_at, success: true });
  } catch (error) {
    console.error("Create scrapbook entry error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/scrapbook/entries — Delete an entry
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID is required." }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ success: true });
    }

    await query(
      "DELETE FROM scrapbook_entries WHERE id = $1 AND owner_id = $2",
      [entryId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete scrapbook entry error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
