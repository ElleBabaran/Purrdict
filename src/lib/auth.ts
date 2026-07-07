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
 * database is configured, JWT_SECRET becomes required — the server will
 * refuse to start if JWT_SECRET is missing in production mode.
 */
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { isDbAvailable } from "@/lib/db";

const DEMO_MODE_FALLBACK_SECRET = "purrdict-demo-mode-secret-no-persistent-data";

/**
 * Cached JWT secret, validated at module initialization.
 * This ensures we fail fast at startup if misconfigured, rather than
 * silently failing on every request.
 */
let cachedSecret: string | null = null;
let secretValidated = false;

/**
 * Validate and cache the JWT secret at module load time.
 * Throws immediately if DATABASE_URL is set but JWT_SECRET is missing,
 * preventing the server from starting in a misconfigured state.
 */
function validateAndCacheSecret(): string {
  if (secretValidated && cachedSecret) {
    return cachedSecret;
  }

  if (process.env.JWT_SECRET) {
    cachedSecret = process.env.JWT_SECRET;
    secretValidated = true;
    return cachedSecret;
  }

  if (!isDbAvailable()) {
    cachedSecret = DEMO_MODE_FALLBACK_SECRET;
    secretValidated = true;
    return cachedSecret;
  }

  // Production mode (DATABASE_URL set) but JWT_SECRET missing
  const error = new Error(
    "FATAL: JWT_SECRET environment variable must be set when DATABASE_URL is configured. " +
    "The server cannot start without a secure JWT signing key in production mode."
  );
  console.error(error.message);
  throw error;
}

// Validate secret at module load time - fail fast if misconfigured
try {
  validateAndCacheSecret();
} catch (error) {
  // Re-throw to prevent server startup
  throw error;
}

export function getJwtSecret(): string {
  // Return cached secret - validation already happened at module load
  return validateAndCacheSecret();
}

export function signUserToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

/**
 * Verify a JWT token and return the decoded payload, or null if invalid.
 * Only catches JWT verification errors (invalid signature, expired, etc.),
 * not configuration errors (which should have been caught at startup).
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const secret = getJwtSecret(); // Should never throw after module init
    return jwt.verify(token, secret) as { userId: string; email: string };
  } catch (error) {
    // Log JWT verification failures for security monitoring
    if (error instanceof Error && error.name === "JsonWebTokenError") {
      console.warn("JWT verification failed: Invalid token signature or format");
    } else if (error instanceof Error && error.name === "TokenExpiredError") {
      console.warn("JWT verification failed: Token expired");
    } else {
      // Unexpected error - log it but don't expose details to caller
      console.error("Unexpected error during JWT verification:", error);
    }
    return null;
  }
}

/**
 * Extracts and verifies the userId from a request's Bearer token.
 * Returns null for any failure (missing header, invalid/expired token).
 * Configuration errors should have been caught at server startup.
 */
export function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const decoded = verifyToken(auth.slice(7));
  return decoded?.userId ?? null;
}
