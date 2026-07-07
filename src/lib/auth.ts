/**
 * Centralized JWT authentication utilities.
 * 
 * This module ensures JWT_SECRET is properly configured and provides
 * secure token signing and verification functions.
 */

import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Get the JWT secret from environment variables.
 * Throws an error if JWT_SECRET is not configured to prevent
 * falling back to insecure defaults.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "This is required for secure token signing and verification. " +
      "Please configure JWT_SECRET in your environment."
    );
  }
  
  return secret;
}

/**
 * Extract and verify JWT from Authorization header.
 * Returns the userId from the token payload, or null if invalid/missing.
 */
export function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  
  try {
    const token = auth.slice(7);
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * Sign a JWT token with the configured secret.
 */
export function signToken(payload: object, options?: jwt.SignOptions): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, options);
}
