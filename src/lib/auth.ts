/**
 * Shared JWT helpers for API routes.
 *
 * Centralizes secret resolution so there is exactly one fallback value in
 * the codebase (previously every route redeclared
 * `process.env.JWT_SECRET || "purrdict-dev-secret-change-in-prod"`, a
 * hardcoded string that is visible to anyone who reads the source. Since
 * that fallback was used to both sign and verify tokens whenever
 * JWT_SECRET wasn't set, anyone who read the code could mint a valid JWT
 * for any userId and access that user's cats/scrapbook/etc — a predictable
 * token / auth bypass, not just a "secret in source" hygiene issue).
 *
 * The fallback is now only used in Demo Mode (no DATABASE_URL configured),
 * where there is no persistent per-user data to protect. As soon as a real
 * database is configured, JWT_SECRET becomes required — requests fail
 * closed instead of silently signing/verifying with a public string.
 */
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { isDbAvailable } from "@/lib/db";

const DEMO_MODE_FALLBACK_SECRET = "purrdict-demo-mode-secret-no-persistent-data";

export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (!isDbAvailable()) return DEMO_MODE_FALLBACK_SECRET;
  throw new Error(
    "JWT_SECRET environment variable must be set when DATABASE_URL is configured."
  );
}

export function signUserToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

/**
 * Extracts and verifies the userId from a request's Bearer token.
 * Returns null for any failure (missing header, invalid/expired token,
 * or a misconfigured server — never throws to the caller).
 */
export function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), getJwtSecret()) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}
