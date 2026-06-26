/**
 * PostgreSQL connection pool.
 * Uses the `pg` package directly — no ORM, no Supabase.
 *
 * Set DATABASE_URL in your .env.local:
 *   DATABASE_URL=postgres://user:pass@localhost:5432/purrdict
 */

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // SSL for production
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

// Log connection errors
pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err);
});

export default pool;

/**
 * Helper: execute a parameterized query.
 * Always use parameterized queries ($1, $2) to prevent SQL injection.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
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
