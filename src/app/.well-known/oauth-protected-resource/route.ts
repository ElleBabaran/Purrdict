import { NextResponse } from "next/server";
import { getProtectedResourceMetadata } from "@/lib/oauth";

export async function GET() {
  return NextResponse.json(getProtectedResourceMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
