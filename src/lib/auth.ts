import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Get JWT secret from environment variable.
 * Throws an error if JWT_SECRET is not configured to prevent insecure deployments.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "This is a critical security requirement. " +
      "Please configure JWT_SECRET before starting the application."
    );
  }
  
  return secret;
}

/**
 * Sign a JWT token with the configured secret.
 * @param payload - The payload to encode in the token
 * @param options - JWT sign options (e.g., expiresIn)
 * @returns Signed JWT token
 */
export function signToken(
  payload: { userId: string; email: string },
  options?: jwt.SignOptions
): string {
  return jwt.sign(payload, getJwtSecret(), options);
}

/**
 * Verify a JWT token and return the decoded payload.
 * @param token - The JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
  } catch {
    return null;
  }
}

/**
 * Extract and verify the user ID from the Authorization header.
 * @param request - The Next.js request object
 * @returns The authenticated user ID or null if unauthorized
 */
export function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  
  const token = auth.slice(7);
  const decoded = verifyToken(token);
  
  return decoded?.userId ?? null;
}
