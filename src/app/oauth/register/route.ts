import { NextRequest, NextResponse } from "next/server";
import { registerClient } from "@/lib/oauth";

/**
 * OAuth 2.0 Dynamic Client Registration (RFC 7591)
 * Claude uses this to register itself as a client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.redirect_uris || !Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
      return NextResponse.json(
        { error: "invalid_client_metadata", error_description: "redirect_uris is required" },
        { status: 400 }
      );
    }

    // Validate redirect URIs
    for (const uri of body.redirect_uris) {
      if (typeof uri !== "string") {
        return NextResponse.json(
          { error: "invalid_client_metadata", error_description: "redirect_uris must be strings" },
          { status: 400 }
        );
      }
      // Allow https and localhost http (for Claude Code)
      const parsed = new URL(uri);
      const isLocalhost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      if (parsed.protocol !== "https:" && !isLocalhost) {
        return NextResponse.json(
          {
            error: "invalid_client_metadata",
            error_description: "redirect_uris must use https (or http for localhost)",
          },
          { status: 400 }
        );
      }
    }

    // Validate grant types if provided
    const allowedGrants = ["authorization_code", "refresh_token"];
    if (body.grant_types) {
      for (const gt of body.grant_types) {
        if (!allowedGrants.includes(gt)) {
          return NextResponse.json(
            { error: "invalid_client_metadata", error_description: `Unsupported grant_type: ${gt}` },
            { status: 400 }
          );
        }
      }
    }

    const client = await registerClient({
      client_name: body.client_name,
      redirect_uris: body.redirect_uris,
      grant_types: body.grant_types || ["authorization_code"],
      response_types: body.response_types || ["code"],
      scope: body.scope,
      token_endpoint_auth_method: body.token_endpoint_auth_method || "none",
    });

    // RFC 7591 response
    const response: Record<string, unknown> = {
      client_id: client.client_id,
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      grant_types: client.grant_types,
      response_types: client.response_types,
      scope: client.scope || "read write",
      token_endpoint_auth_method: client.token_endpoint_auth_method,
      client_id_issued_at: client.client_id_issued_at,
      client_secret_expires_at: client.client_secret_expires_at,
    };

    // Include client_secret only if one was generated
    if (client.client_secret) {
      response.client_secret = client.client_secret;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("OAuth DCR error:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "Registration failed" },
      { status: 500 }
    );
  }
}
