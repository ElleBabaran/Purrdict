import { NextResponse } from "next/server";
import { getAuthorizationServerMetadata } from "@/lib/oauth";

export async function GET() {
  return NextResponse.json(getAuthorizationServerMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
