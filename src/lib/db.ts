/**
 * Neon PostgreSQL connection (serverless-optimized).
 *
 * Set DATABASE_URL in your .env.local:
 *   DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require
 *
 * If DATABASE_URL is not set, the app runs in "demo mode".
 */

import { Pool } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

/**
 * Check if database is available.
 */
export function isDbAvailable(): boolean {
  return pool !== null;
}

/**
 * Execute a parameterized query.
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
 * Execute and return single row or null.
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export default pool;
