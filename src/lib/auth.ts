/**
 * Shared JWT helpers for API routes.
 *
 * Centralizes JWT secret management with strict validation to prevent
 * authentication bypass vulnerabilities. Previously, routes used
 * `process.env.JWT_SECRET || "purrdict-dev-secret-change-in-prod"`, a
 * hardcoded fallback that allowed attackers to forge valid JWTs for
 * arbitrary user IDs whenever JWT_SECRET was unset.
 *
 * This module now requires JWT_SECRET to be explicitly set in all
 * environments. The server will refuse to start if JWT_SECRET is missing,
 * preventing any possibility of using a predictable fallback secret.
 */
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Cached JWT secret, validated at module initialization.
 * This ensures we fail fast at startup if misconfigured, rather than
 * silently failing on every request.
 */
let cachedSecret: string | null = null;
let secretValidated = false;

/**
 * Validate and cache the JWT secret at module load time.
 * Throws immediately if JWT_SECRET is not set, preventing the server
 * from starting in a misconfigured state.
 *
 * Security: No fallback secrets are permitted. Any fallback, even for
 * demo/development environments, creates a risk that the predictable
 * value could be used to forge tokens if the deployment is misconfigured.
 */
function validateAndCacheSecret(): string {
  if (secretValidated && cachedSecret) {
    return cachedSecret;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error(
      "FATAL: JWT_SECRET environment variable is required. " +
      "The server cannot start without a secure JWT signing key. " +
      "Set JWT_SECRET to a cryptographically random string (minimum 32 characters). " +
      "Generate one with: openssl rand -base64 32"
    );
    console.error(error.message);
    throw error;
  }

  // Validate minimum secret length to prevent weak secrets
  if (process.env.JWT_SECRET.length < 32) {
    const error = new Error(
      "FATAL: JWT_SECRET must be at least 32 characters long. " +
      "Current length: " + process.env.JWT_SECRET.length + ". " +
      "Use a cryptographically random string. Generate one with: openssl rand -base64 32"
    );
    console.error(error.message);
    throw error;
  }

  cachedSecret = process.env.JWT_SECRET;
  secretValidated = true;
  return cachedSecret;
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
