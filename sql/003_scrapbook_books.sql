-- ══════════════════════════════════════════════════════════
-- SCRAPBOOK BOOKS (albums)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scrapbook_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_color TEXT NOT NULL DEFAULT '#FF8FA3',
  cover_pattern TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrapbook_books_owner ON scrapbook_books(owner_id, created_at DESC);

-- Add book_id column to scrapbook_entries
ALTER TABLE scrapbook_entries ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES scrapbook_books(id) ON DELETE CASCADE;

-- Add media_data column for storing base64 encoded files
ALTER TABLE scrapbook_entries ADD COLUMN IF NOT EXISTS media_data TEXT;
