import { NextRequest, NextResponse } from "next/server";
import { query, isDbAvailable } from "@/lib/db";
import { getUserId } from "@/lib/auth";

// GET /api/scrapbook/books — List user's scrapbook books
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isDbAvailable()) {
    return NextResponse.json({ books: [] });
  }

  try {
    const books = await query(
      `SELECT b.*, 
        (SELECT COUNT(*) FROM scrapbook_entries e WHERE e.book_id = b.id) as entry_count
       FROM scrapbook_books b 
       WHERE b.owner_id = $1 
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return NextResponse.json({ books });
  } catch (error) {
    console.error("List scrapbook books error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/scrapbook/books — Create a new book
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, coverColor, coverPattern } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ id: "demo-book-" + Date.now(), success: true });
    }

    const rows = await query<{ id: string; created_at: string }>(
      `INSERT INTO scrapbook_books (owner_id, name, cover_color, cover_pattern)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [userId, name.trim(), coverColor || "#FF8FA3", coverPattern || "none"]
    );

    return NextResponse.json({ id: rows[0].id, createdAt: rows[0].created_at, success: true });
  } catch (error) {
    console.error("Create scrapbook book error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/scrapbook/books — Delete a book
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("id");

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required." }, { status: 400 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ success: true });
    }

    await query(
      "DELETE FROM scrapbook_books WHERE id = $1 AND owner_id = $2",
      [bookId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete scrapbook book error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
