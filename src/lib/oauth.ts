/**
 * OAuth 2.0 Authorization Server utilities for PurrDict.
 *
 * Implements RFC 6749, RFC 7591 (DCR), RFC 7636 (PKCE S256),
 * and RFC 9728 (Protected Resource Metadata) to support
 * Claude Connector authentication.
 */

import crypto from "crypto";
import { query, queryOne, isDbAvailable } from "@/lib/db";

// ── Configuration ──

/** Base URL of this server — set in .env.local or inferred */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getIssuer(): string {
  return getBaseUrl();
}

// ── PKCE ──

/** Constant-time string comparison to avoid timing side-channels on secrets/hashes. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal length to avoid leaking length via
    // early return timing, then fail.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: string
): boolean {
  // "plain" is intentionally not accepted: with plain, code_challenge ==
  // code_verifier, so anywhere the challenge is observable (browser
  // history, referrer headers, server logs) fully defeats PKCE's
  // protection against authorization code interception. RFC 7636 allows
  // plain only as a fallback for clients that can't compute SHA-256;
  // every realistic OAuth client for this server can, so S256 is
  // required unconditionally.
  if (method !== "S256") return false;
  const hash = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  return timingSafeStringEqual(hash, codeChallenge);
}

/**
 * Whether an authorization request must include a PKCE code_challenge.
 *
 * Previously code_challenge was fully optional for every client. Combined
 * with the /oauth/authorize redirect_uri validation gap (see
 * isRedirectUriRegistered below — that gap is what's fixed there), an
 * authorization code was a bare bearer credential: anyone who obtained it
 * (e.g. via a redirect to an attacker-controlled URI) could redeem it at
 * /oauth/token with no further proof of possession. Requiring PKCE for
 * every authorization_code request (not just public clients) means a
 * code is worthless without the original code_verifier, which never
 * leaves the legitimate client. This matches OAuth 2.1's blanket PKCE
 * requirement rather than only mandating it for public clients.
 */
export function isPkceRequired(): boolean {
  return true;
}

// ── Redirect URI validation ──

/**
 * Checks a requested redirect_uri against a client's registered
 * redirect_uris. For localhost/127.0.0.1 the port is ignored (RFC 8252
 * §7.3 — native apps often bind to an ephemeral port), otherwise an exact
 * match is required.
 */
export function isRedirectUriRegistered(client: OAuthClient, redirectUri: string): boolean {
  return client.redirect_uris.some((uri) => {
    try {
      const registered = new URL(uri);
      const requested = new URL(redirectUri);
      if (
        (registered.hostname === "localhost" || registered.hostname === "127.0.0.1") &&
        (requested.hostname === "localhost" || requested.hostname === "127.0.0.1")
      ) {
        return registered.pathname === requested.pathname;
      }
      return uri === redirectUri;
    } catch {
      return uri === redirectUri;
    }
  });
}

// ── Token generation ──

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ── OAuth Metadata ──

export function getAuthorizationServerMetadata() {
  const issuer = getIssuer();
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    scopes_supported: ["read", "write", "offline_access"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    code_challenge_methods_supported: ["S256"],
    client_id_metadata_document_supported: true,
  };
}

export function getProtectedResourceMetadata() {
  const baseUrl = getBaseUrl();
  return {
    resource: baseUrl,
    authorization_servers: [getIssuer()],
    scopes_supported: ["read", "write", "offline_access"],
    bearer_methods_supported: ["header"],
  };
}

// ── Client Registration (DCR) ──

export interface OAuthClient {
  client_id: string;
  client_secret: string | null;
  client_name: string | null;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  scope: string | null;
  token_endpoint_auth_method: string;
  client_id_issued_at: number;
  client_secret_expires_at: number;
}

export async function registerClient(params: {
  client_name?: string;
  redirect_uris: string[];
  grant_types?: string[];
  response_types?: string[];
  scope?: string;
  token_endpoint_auth_method?: string;
}): Promise<OAuthClient> {
  if (!isDbAvailable()) {
    // Demo mode: return a fake client
    const clientId = "client_" + crypto.randomBytes(16).toString("hex");
    return {
      client_id: clientId,
      client_secret: null,
      client_name: params.client_name || null,
      redirect_uris: params.redirect_uris,
      grant_types: params.grant_types || ["authorization_code"],
      response_types: params.response_types || ["code"],
      scope: params.scope || "read write",
      token_endpoint_auth_method: params.token_endpoint_auth_method || "none",
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0,
    };
  }

  const authMethod = params.token_endpoint_auth_method || "none";
  const clientSecret =
    authMethod === "client_secret_post"
      ? crypto.randomBytes(32).toString("hex")
      : null;

  const rows = await query<OAuthClient>(
    `INSERT INTO oauth_clients (client_name, client_secret, redirect_uris, grant_types, response_types, scope, token_endpoint_auth_method)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING client_id, client_secret, client_name, redirect_uris, grant_types, response_types, scope, token_endpoint_auth_method, client_id_issued_at, client_secret_expires_at`,
    [
      params.client_name || null,
      clientSecret,
      params.redirect_uris,
      params.grant_types || ["authorization_code"],
      params.response_types || ["code"],
      params.scope || "read write",
      authMethod,
    ]
  );

  return rows[0];
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  if (!isDbAvailable()) return null;
  const row = await queryOne<OAuthClient>(
    "SELECT client_id, client_secret, client_name, redirect_uris, grant_types, response_types, scope, token_endpoint_auth_method, client_id_issued_at, client_secret_expires_at FROM oauth_clients WHERE client_id = $1",
    [clientId]
  );
  if (!row) return null;

  // Ensure array fields are actual arrays (Postgres may return string representation)
  if (typeof row.redirect_uris === "string") {
    row.redirect_uris = parsePostgresArray(row.redirect_uris as unknown as string);
  }
  if (typeof row.grant_types === "string") {
    row.grant_types = parsePostgresArray(row.grant_types as unknown as string);
  }
  if (typeof row.response_types === "string") {
    row.response_types = parsePostgresArray(row.response_types as unknown as string);
  }

  return row;
}

/** Parse Postgres array literal like {a,b,c} into JS array */
function parsePostgresArray(str: string): string[] {
  if (!str || str === "{}") return [];
  // Remove outer braces and split
  const inner = str.replace(/^\{/, "").replace(/\}$/, "");
  // Handle quoted values
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) result.push(current);
  return result;
}

// ── Authorization Codes ──

export async function createAuthorizationCode(params: {
  clientId: string;
  userId: string;
  redirectUri: string;
  scope?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}): Promise<string> {
  if (!isDbAvailable()) {
    return crypto.randomBytes(32).toString("hex");
  }

  const rows = await query<{ code: string }>(
    `INSERT INTO oauth_codes (client_id, user_id, redirect_uri, scope, code_challenge, code_challenge_method)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING code`,
    [
      params.clientId,
      params.userId,
      params.redirectUri,
      params.scope || null,
      params.codeChallenge || null,
      params.codeChallengeMethod || "S256",
    ]
  );

  return rows[0].code;
}

export interface AuthCode {
  code: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scope: string | null;
  code_challenge: string | null;
  code_challenge_method: string | null;
  expires_at: string;
  used: boolean;
}

export async function consumeAuthorizationCode(code: string): Promise<AuthCode | null> {
  if (!isDbAvailable()) return null;

  const row = await queryOne<AuthCode>(
    `UPDATE oauth_codes
     SET used = true
     WHERE code = $1 AND used = false AND expires_at > now()
     RETURNING code, client_id, user_id, redirect_uri, scope, code_challenge, code_challenge_method, expires_at, used`,
    [code]
  );

  return row;
}

// ── Tokens ──

export async function createTokenPair(params: {
  clientId: string;
  userId: string;
  scope?: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}> {
  const accessToken = generateToken();
  const refreshToken = generateToken();
  const expiresIn = 3600; // 1 hour

  if (isDbAvailable()) {
    await query(
      `INSERT INTO oauth_tokens (access_token, refresh_token, client_id, user_id, scope, access_token_expires_at, refresh_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + interval '1 hour', now() + interval '30 days')`,
      [accessToken, refreshToken, params.clientId, params.userId, params.scope || null]
    );
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    token_type: "Bearer",
    ...(params.scope ? { scope: params.scope } : {}),
  };
}

/**
 * Looks up the oauth_tokens row for a refresh token without consuming it —
 * used by the token endpoint to resolve which client actually owns this
 * token *before* deciding whether client authentication is required.
 */
export async function findTokenByRefreshToken(refreshToken: string): Promise<{
  id: string;
  client_id: string;
  user_id: string;
  scope: string | null;
} | null> {
  if (!isDbAvailable()) return null;

  return queryOne<{ id: string; client_id: string; user_id: string; scope: string | null }>(
    `SELECT id, client_id, user_id, scope
     FROM oauth_tokens
     WHERE refresh_token = $1 AND revoked = false AND refresh_token_expires_at > now()`,
    [refreshToken]
  );
}

export async function refreshAccessToken(refreshTokenId: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
} | null> {
  if (!isDbAvailable()) return null;

  // Find existing token by its row id (already resolved + client-authenticated
  // by the caller — see handleRefreshToken in src/app/oauth/token/route.ts).
  const existing = await queryOne<{
    id: string;
    client_id: string;
    user_id: string;
    scope: string | null;
    refresh_token_expires_at: string;
  }>(
    `SELECT id, client_id, user_id, scope, refresh_token_expires_at
     FROM oauth_tokens
     WHERE id = $1 AND revoked = false AND refresh_token_expires_at > now()`,
    [refreshTokenId]
  );

  if (!existing) return null;

  // Revoke old token (rotation)
  await query("UPDATE oauth_tokens SET revoked = true WHERE id = $1", [existing.id]);

  // Issue new pair
  return createTokenPair({
    clientId: existing.client_id,
    userId: existing.user_id,
    scope: existing.scope || undefined,
  });
}

export async function validateAccessToken(accessToken: string): Promise<{
  userId: string;
  scope: string | null;
} | null> {
  if (!isDbAvailable()) return null;

  const token = await queryOne<{ user_id: string; scope: string | null }>(
    `SELECT user_id, scope FROM oauth_tokens
     WHERE access_token = $1 AND revoked = false AND access_token_expires_at > now()`,
    [accessToken]
  );

  return token ? { userId: token.user_id, scope: token.scope } : null;
}
