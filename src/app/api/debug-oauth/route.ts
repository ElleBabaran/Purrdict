import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/oauth";
import { query, isDbAvailable } from "@/lib/db";

/**
 * Temporary debug endpoint to diagnose OAuth authorize failures.
 * DELETE THIS after fixing the issue.
 */
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id");

  const diagnostics: Record<string, unknown> = {
    dbAvailable: isDbAvailable(),
    clientId,
    timestamp: new Date().toISOString(),
  };

  try {
    // List all registered clients
    const clients = await query(
      "SELECT client_id, client_name, redirect_uris, array_length(redirect_uris, 1) as uri_count, pg_typeof(redirect_uris) as uris_type FROM oauth_clients ORDER BY created_at DESC LIMIT 5"
    );
    diagnostics.clients = clients;
  } catch (err) {
    diagnostics.clientsError = String(err);
  }

  if (clientId) {
    try {
      const client = await getClient(clientId);
      diagnostics.resolvedClient = client;
      diagnostics.redirectUrisType = client ? typeof client.redirect_uris : null;
      diagnostics.redirectUrisIsArray = client ? Array.isArray(client.redirect_uris) : null;
    } catch (err) {
      diagnostics.getClientError = String(err);
    }
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
