// One-off diagnostic: inspect the actual stored scrapbook video entries
// to see what's really in the database (size, header bytes, MIME prefix)
// instead of guessing. Run with: node scripts/debug-video-entry.mjs
import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Minimal .env.local parser (avoid adding a dependency for a one-off script)
const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const rows = await pool.query(
  `SELECT id, type, title, media_data, created_at
   FROM scrapbook_entries
   WHERE type = 'video'
   ORDER BY created_at DESC
   LIMIT 5`
);

if (rows.rows.length === 0) {
  console.log("No video entries found in the database.");
} else {
  for (const row of rows.rows) {
    const data = row.media_data || "";
    console.log("----------------------------------------");
    console.log("id:", row.id);
    console.log("title:", row.title);
    console.log("created_at:", row.created_at);
    console.log("media_data length (chars):", data.length);
    console.log("media_data prefix (first 80 chars):", data.slice(0, 80));
    console.log("media_data suffix (last 40 chars):", data.slice(-40));
  }
}

await pool.end();
