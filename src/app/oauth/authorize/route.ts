import { NextRequest, NextResponse } from "next/server";
import {
  getClient,
  createAuthorizationCode,
  isRedirectUriRegistered,
  isPkceRequired,
  OAuthClient,
} from "@/lib/oauth";
import { queryOne, isDbAvailable } from "@/lib/db";
import bcrypt from "bcryptjs";

const ALLOWED_SCOPES = new Set(["read", "write", "offline_access"]);

/**
 * Resolves and validates the OAuth client for an authorization request.
 *
 * Fails closed: the client must exist and the requested redirect_uri must
 * be one of its registered URIs. Previously, any lookup failure (client
 * not found, or getClient() throwing) fell through to an "Unknown App"
 * placeholder that skipped redirect_uri validation entirely — an attacker
 * could supply a nonexistent client_id together with any redirect_uri they
 * controlled, and the server would still render the login form and (had
 * the later INSERT not been blocked by a foreign key) hand back an
 * authorization code redeemable at that attacker-controlled URI. Demo Mode
 * (no DATABASE_URL) previously also skipped validation, allowing arbitrary
 * redirect URIs; it now fails closed and requires database-backed client
 * registration for all authorization flows.
 */
async function resolveClientOrError(
  clientId: string,
  redirectUri: string
): Promise<{ client: OAuthClient | null; error: string | null }> {
  if (!isDbAvailable()) {
    return {
      client: null,
      error: "OAuth authorization requires a configured database. Please set DATABASE_URL.",
    };
  }

  let client: OAuthClient | null;
  try {
    client = await getClient(clientId);
  } catch (err) {
    console.error("OAuth getClient error:", err);
    return { client: null, error: "Unable to validate client. Please try again." };
  }

  if (!client) {
    return { client: null, error: "Unknown client_id. This app must register first." };
  }

  if (!isRedirectUriRegistered(client, redirectUri)) {
    return { client: null, error: "redirect_uri does not match any URI registered for this client." };
  }

  return { client, error: null };
}

/**
 * OAuth 2.0 Authorization Endpoint
 *
 * GET  — renders the consent/login page
 * POST — processes the login + consent form
 */

function htmlPage(params: {
  clientName: string;
  scope: string;
  error?: string;
  clientId: string;
  redirectUri: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  responseType: string;
  requestedScope: string;
}): string {
  const errorHtml = params.error
    ? `<div style="background:#fff0f0;border:1px solid #ffcdd2;border-radius:8px;padding:12px;margin-bottom:16px;color:#c62828;font-size:14px;">${params.error}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authorize — PurrDict</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #faf8f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: white;
      border: 3px solid #3d2c2e;
      border-radius: 16px;
      box-shadow: 6px 6px 0 #3d2c2e;
      padding: 32px;
      max-width: 400px;
      width: 100%;
    }
    .logo { text-align: center; margin-bottom: 24px; font-size: 48px; }
    h1 { font-size: 18px; color: #3d2c2e; text-align: center; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #7a6b6e; text-align: center; margin-bottom: 24px; }
    .scope-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #166534;
    }
    label { display: block; font-size: 12px; font-weight: 600; color: #7a6b6e; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    input[type="email"], input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e8e2dd;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 16px;
      background: #faf8f5;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #7fd8be; }
    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.1s;
    }
    .btn:active { transform: translateY(2px); }
    .btn-allow { background: linear-gradient(135deg, #7fd8be, #5cb89e); color: white; box-shadow: 4px 4px 0 #3d2c2e; margin-bottom: 10px; }
    .btn-deny { background: #f5f5f5; color: #7a6b6e; border: 1px solid #e0e0e0; }
    .redirect-note { font-size: 11px; color: #999; text-align: center; margin-top: 16px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🐱</div>
    <h1>Authorize ${escapeHtml(params.clientName)}</h1>
    <p class="subtitle">wants to access your PurrDict account</p>

    <div class="scope-box">
      <strong>Permissions requested:</strong><br/>
      ${formatScopes(params.scope)}
    </div>

    ${errorHtml}

    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(params.clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirectUri)}" />
      <input type="hidden" name="state" value="${escapeHtml(params.state || "")}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.codeChallenge || "")}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(params.codeChallengeMethod || "S256")}" />
      <input type="hidden" name="response_type" value="${escapeHtml(params.responseType)}" />
      <input type="hidden" name="scope" value="${escapeHtml(params.requestedScope)}" />

      <label for="email">Email</label>
      <input type="email" id="email" name="email" required placeholder="you@email.com" />

      <label for="password">Password</label>
      <input type="password" id="password" name="password" required placeholder="Your password" />

      <button type="submit" name="action" value="allow" class="btn btn-allow">✨ Allow Access</button>
      <button type="submit" name="action" value="deny" class="btn btn-deny">Deny</button>
    </form>

    <p class="redirect-note">You'll be redirected to: ${escapeHtml(params.redirectUri)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatScopes(scope: string): string {
  const descriptions: Record<string, string> = {
    read: "📖 Read your cats, health data, and scrapbook",
    write: "✏️ Create and update entries",
    offline_access: "🔄 Stay connected when you're away",
  };
  // XSS fix: `scope` comes straight from the request's query string /
  // form body. Any token not in `descriptions` — i.e. anything an
  // attacker puts in the `scope` param, like ?scope=<script>...</script> —
  // was previously interpolated into the page unescaped and would execute
  // in the victim's browser right on the login/consent page. Unknown
  // scopes are now HTML-escaped, and the value is additionally restricted
  // to a known allowlist before this function is ever called (see
  // sanitizeScope), so this is defense in depth rather than the only guard.
  return scope
    .split(" ")
    .filter(Boolean)
    .map((s) => descriptions[s] || escapeHtml(s))
    .join("<br/>");
}

/**
 * Restricts the requested scope string to the server's known scopes.
 * Unknown/unexpected tokens are dropped rather than rejected outright so
 * a client requesting a slightly different scope set still gets a
 * usable (if reduced) consent screen instead of a hard error.
 */
function sanitizeScope(scope: string): string {
  const allowed = scope.split(" ").filter((s) => ALLOWED_SCOPES.has(s));
  return allowed.length > 0 ? allowed.join(" ") : "read";
}

/**
 * Validates that a string is a well-formed URL.
 * Returns true if the URL can be parsed, false otherwise.
 * This prevents malformed redirect_uri values from causing exceptions
 * that could leak stack traces or internal implementation details.
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// ── GET: Show consent page ──

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const clientId = params.get("client_id");
    const redirectUri = params.get("redirect_uri");
    const responseType = params.get("response_type");
    const scope = sanitizeScope(params.get("scope") || "read write");
    const state = params.get("state") || undefined;
    const codeChallenge = params.get("code_challenge") || undefined;
    const codeChallengeMethod = params.get("code_challenge_method") || "S256";

    if (!clientId || !redirectUri || responseType !== "code") {
      return new NextResponse("Invalid authorization request. Missing required parameters.", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Validate redirect_uri format before any further processing to prevent
    // malformed URLs from causing exceptions that could leak implementation details
    if (!isValidUrl(redirectUri)) {
      return new NextResponse("Invalid redirect_uri format.", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Every authorization_code request must carry a PKCE S256 challenge
    // (see isPkceRequired in src/lib/oauth.ts) — reject before showing the
    // login form so credentials are never entered against a flow that
    // can't be completed anyway.
    if (isPkceRequired() && (!codeChallenge || codeChallengeMethod !== "S256")) {
      return new NextResponse(
        "This authorization request is missing a PKCE code_challenge (S256). The client must generate a code_verifier/code_challenge pair.",
        { status: 400, headers: { "Content-Type": "text/plain" } }
      );
    }

    // Validate client + redirect_uri together (fails closed — see
    // resolveClientOrError doc comment above).
    const { client, error: clientError } = await resolveClientOrError(clientId, redirectUri);
    if (clientError) {
      return new NextResponse(clientError, {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // After validation, client must be non-null (resolveClientOrError fails
    // closed and returns an error if the client doesn't exist or the
    // redirect_uri doesn't match).
    const clientName = client?.client_name || "Unknown App";

    const html = htmlPage({
      clientName,
      scope,
      clientId,
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
      responseType: responseType,
      requestedScope: scope,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    // Information exposure fix: the previous version included the raw
    // error message and full stack trace in the response body. Stack
    // traces reveal file paths, dependency versions, and internal
    // control flow — useful to an attacker probing this endpoint, not to
    // a legitimate OAuth client. Full detail still goes to server logs.
    console.error("OAuth authorize GET error:", error);
    return new NextResponse("Internal server error during authorization.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// ── POST: Process consent ──

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const action = formData.get("action") as string;
    const clientId = formData.get("client_id") as string;
    const redirectUri = formData.get("redirect_uri") as string;
    const state = formData.get("state") as string;
    const codeChallenge = formData.get("code_challenge") as string;
    const codeChallengeMethod = (formData.get("code_challenge_method") as string) || "S256";
    const scope = sanitizeScope((formData.get("scope") as string) || "read write");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!clientId || !redirectUri || !email || !password) {
      return new NextResponse("Missing required form fields.", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Validate redirect_uri format before any further processing to prevent
    // malformed URLs from causing exceptions that could leak implementation details.
    // This is critical in the deny flow (line 347) where new URL(redirectUri) is
    // called directly, and in Demo Mode where resolveClientOrError skips validation.
    if (!isValidUrl(redirectUri)) {
      return new NextResponse("Invalid redirect_uri format.", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // OAuth/SSO misconfiguration fix: the client and its redirect_uri
    // were never re-validated on POST — only the GET handler checked
    // them, and only when a client happened to be found. That meant an
    // attacker could skip the GET step entirely and POST straight to
    // this endpoint with client_id="" (or any unregistered value) and an
    // attacker-controlled redirect_uri; the server would still
    // authenticate the victim's password and hand back a real
    // authorization code redirected to that attacker URI. Re-checking
    // here closes that gap regardless of how the POST was reached.
    const { client, error: clientError } = await resolveClientOrError(clientId, redirectUri);
    if (clientError) {
      return new NextResponse(clientError, {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (isPkceRequired() && (!codeChallenge || codeChallengeMethod !== "S256")) {
      return new NextResponse(
        "This authorization request is missing a PKCE code_challenge (S256).",
        { status: 400, headers: { "Content-Type": "text/plain" } }
      );
    }

    // User denied
    if (action === "deny") {
      const denyUrl = new URL(redirectUri);
      denyUrl.searchParams.set("error", "access_denied");
      denyUrl.searchParams.set("error_description", "User denied the request");
      if (state) denyUrl.searchParams.set("state", state);
      return NextResponse.redirect(denyUrl.toString(), 302);
    }

    // Authenticate user
    const user = await queryOne<{
      id: string;
      email: string;
      password_hash: string;
      display_name: string;
    }>("SELECT id, email, password_hash, display_name FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      // Re-render with error. client is guaranteed non-null here because
      // resolveClientOrError already validated it and would have returned
      // an error if the client didn't exist or the redirect_uri didn't match.
      const html = htmlPage({
        clientName: client?.client_name || "External App",
        scope,
        error: "Invalid email or password. Please try again.",
        clientId,
        redirectUri,
        state: state || undefined,
        codeChallenge: codeChallenge || undefined,
        codeChallengeMethod: codeChallengeMethod || "S256",
        responseType: "code",
        requestedScope: scope,
      });
      return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Generate authorization code
    const code = await createAuthorizationCode({
      clientId,
      userId: user.id,
      redirectUri,
      scope: scope || undefined,
      codeChallenge: codeChallenge || undefined,
      codeChallengeMethod: codeChallengeMethod || "S256",
    });

    // Redirect back with code
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("code", code);
    if (state) callbackUrl.searchParams.set("state", state);

    return NextResponse.redirect(callbackUrl.toString(), 302);
  } catch (error) {
    console.error("OAuth authorize POST error:", error);
    return new NextResponse("Internal server error during authorization.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
