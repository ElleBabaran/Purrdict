import { NextRequest, NextResponse } from "next/server";
import { getClient, createAuthorizationCode } from "@/lib/oauth";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

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
    ? `<div style="background:#fff0f0;border:1px solid #ffcdd2;border-radius:8px;padding:12px;margin-bottom:16px;color:#c62828;font-size:14px;">${escapeHtml(params.error)}</div>`
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
  return scope
    .split(" ")
    .map((s) => descriptions[s] || escapeHtml(s))
    .join("<br/>");
}

// ── GET: Show consent page ──

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const clientId = params.get("client_id");
    const redirectUri = params.get("redirect_uri");
    const responseType = params.get("response_type");
    const scope = params.get("scope") || "read write";
    const state = params.get("state") || undefined;
    const codeChallenge = params.get("code_challenge") || undefined;
    const codeChallengeMethod = params.get("code_challenge_method") || "S256";

    if (!clientId || !redirectUri || responseType !== "code") {
      return new NextResponse("Invalid authorization request. Missing required parameters.", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Validate client (gracefully handle missing table)
    let client = null;
    try {
      client = await getClient(clientId);
    } catch (err) {
      console.error("OAuth getClient error (table may not exist):", err);
    }

    let clientName = "Unknown App";
    if (client) {
      // Validate redirect_uri matches registered URIs
      const uriMatch = client.redirect_uris.some((uri) => {
        // For localhost URIs, ignore port (per RFC 8252)
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

      if (!uriMatch) {
        return new NextResponse("Invalid redirect_uri for this client.", {
          status: 400,
          headers: { "Content-Type": "text/plain" },
        });
      }
      clientName = client.client_name || "External App";
    }

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
    console.error("OAuth authorize GET error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : "";
    return new NextResponse(
      `Internal server error during authorization.\n\nDebug: ${errMsg}\n${errStack}`,
      {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      }
    );
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
    const codeChallengeMethod = formData.get("code_challenge_method") as string;
    const scope = formData.get("scope") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

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
      // Re-render with error
      let client = null;
      try {
        client = await getClient(clientId);
      } catch {
        // table may not exist
      }
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
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : "";
    return new NextResponse(
      `Internal server error during authorization.\n\nDebug: ${errMsg}\n${errStack}`,
      {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      }
    );
  }
}
