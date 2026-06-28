/**
 * PostgreSQL connection pool.
 * Uses the `pg` package directly — no ORM, no Supabase.
 *
 * Set DATABASE_URL in your .env.local:
 *   DATABASE_URL=postgres://user:pass@host:5432/purrdict
 *
 * If DATABASE_URL is not set, the app runs in "demo mode"
 * (localStorage only, no persistence to DB).
 */

import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

// Only create pool if DATABASE_URL is configured
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    })
  : null;

if (pool) {
  pool.on("error", (err) => {
    console.error("Unexpected PG pool error:", err);
  });
}

export default pool;

/**
 * Check if database is available.
 */
export function isDbAvailable(): boolean {
  return pool !== null;
}

/**
 * Helper: execute a parameterized query.
 * Throws if DB is not configured.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (!pool) {
    throw new Error("DATABASE_URL not configured. Running in demo mode.");
  }
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Helper: execute and return single row or null.
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}
