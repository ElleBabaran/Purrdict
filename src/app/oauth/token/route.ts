import { NextRequest, NextResponse } from "next/server";
import {
  consumeAuthorizationCode,
  verifyCodeChallenge,
  createTokenPair,
  refreshAccessToken,
  findTokenByRefreshToken,
  getClient,
  timingSafeStringEqual,
} from "@/lib/oauth";

/**
 * OAuth 2.0 Token Endpoint
 *
 * Accepts application/x-www-form-urlencoded (required by RFC 6749 §4.1.3).
 * Supports grant_type: authorization_code, refresh_token
 */
export async function POST(request: NextRequest) {
  // Parse form-urlencoded body (required by RFC 6749)
  const contentType = request.headers.get("content-type") || "";
  let params: URLSearchParams;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const body = await request.text();
    params = new URLSearchParams(body);
  } else if (contentType.includes("application/json")) {
    // Some clients send JSON — be lenient
    const body = await request.json();
    params = new URLSearchParams(body as Record<string, string>);
  } else {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Content-Type must be application/x-www-form-urlencoded" },
      { status: 415 }
    );
  }

  const grantType = params.get("grant_type");

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(params);
  } else if (grantType === "refresh_token") {
    return handleRefreshToken(params);
  } else {
    return NextResponse.json(
      { error: "unsupported_grant_type", error_description: "Only authorization_code and refresh_token are supported" },
      { status: 400 }
    );
  }
}

async function handleAuthorizationCode(params: URLSearchParams) {
  const code = params.get("code");
  const redirectUri = params.get("redirect_uri");
  const clientId = params.get("client_id");
  const codeVerifier = params.get("code_verifier");

  if (!code || !redirectUri || !clientId) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing code, redirect_uri, or client_id" },
      { status: 400 }
    );
  }

  // Consume the authorization code (marks as used atomically)
  const authCode = await consumeAuthorizationCode(code);
  if (!authCode) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code is invalid, expired, or already used" },
      { status: 400 }
    );
  }

  // Verify client_id matches
  if (authCode.client_id !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 }
    );
  }

  // Verify redirect_uri matches
  if (authCode.redirect_uri !== redirectUri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  // Verify PKCE code_challenge. Every code minted by /oauth/authorize now
  // carries one (see isPkceRequired in src/lib/oauth.ts), so a missing
  // code_challenge here is treated as invalid rather than skipping PKCE
  // verification entirely — the previous `if (authCode.code_challenge)`
  // guard meant a code with no challenge attached skipped this check
  // altogether and could be redeemed with no code_verifier at all.
  if (!authCode.code_challenge) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code is missing a PKCE code_challenge." },
      { status: 400 }
    );
  }
  if (!codeVerifier) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "code_verifier is required" },
      { status: 400 }
    );
  }
  const validPkce = verifyCodeChallenge(
    codeVerifier,
    authCode.code_challenge,
    authCode.code_challenge_method || "S256"
  );
  if (!validPkce) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 }
    );
  }

  // Authenticate client if it's confidential
  const client = await getClient(clientId);
  if (client && client.token_endpoint_auth_method === "client_secret_post") {
    const clientSecret = params.get("client_secret");
    if (!clientSecret || !client.client_secret || !timingSafeStringEqual(clientSecret, client.client_secret)) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Client authentication failed" },
        { status: 401 }
      );
    }
  }

  // Issue tokens
  const tokens = await createTokenPair({
    clientId,
    userId: authCode.user_id,
    scope: authCode.scope || undefined,
  });

  return NextResponse.json(tokens, {
    headers: {
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
    },
  });
}

async function handleRefreshToken(params: URLSearchParams) {
  const refreshToken = params.get("refresh_token");
  const clientId = params.get("client_id");

  if (!refreshToken) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing refresh_token" },
      { status: 400 }
    );
  }

  // Resolve which client this refresh token actually belongs to *before*
  // deciding whether client authentication is required.
  //
  // Auth bypass fix: this previously only ran the client_secret_post check
  // "if (clientId)" was present in the request body — a caller could omit
  // client_id entirely and redeem a confidential client's refresh token
  // with no secret at all, since the code path that authenticates the
  // client would simply never execute. The token's owning client is now
  // looked up from the database record itself (immutable, not attacker-
  // supplied), and if that client is confidential, its secret is always
  // required regardless of what the request did or didn't include.
  const existingToken = await findTokenByRefreshToken(refreshToken);
  if (!existingToken) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Refresh token is invalid, expired, or revoked" },
      { status: 400 }
    );
  }

  // If the request supplied a client_id, it must match the token's actual
  // owning client — otherwise this looks like an attempt to redeem one
  // client's refresh token under a different client's identity.
  if (clientId && clientId !== existingToken.client_id) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id does not match this refresh token" },
      { status: 400 }
    );
  }

  const client = await getClient(existingToken.client_id);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Client no longer exists" },
      { status: 400 }
    );
  }
  
  if (client.token_endpoint_auth_method === "client_secret_post") {
    const clientSecret = params.get("client_secret");
    if (!clientSecret || !client.client_secret || !timingSafeStringEqual(clientSecret, client.client_secret)) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Client authentication failed" },
        { status: 401 }
      );
    }
  }

  const tokens = await refreshAccessToken(existingToken.id);
  if (!tokens) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Refresh token is invalid, expired, or revoked" },
      { status: 400 }
    );
  }

  return NextResponse.json(tokens, {
    headers: {
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
    },
  });
}
