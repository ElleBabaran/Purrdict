import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode/suggest
 *
 * Live address/place autocomplete backed by Geoapify's Address Autocomplete
 * API (https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/).
 *
 * Unlike a plain OSM text-match geocoder (e.g. Photon), Geoapify ranks
 * results by rank.confidence and result_type, so searching a country or
 * city name reliably returns that place first instead of unrelated bars,
 * streets, or landmarks that merely share the same name. Free tier: 3000
 * requests/day, no credit card required — see https://www.geoapify.com/.
 *
 * Requires GEOAPIFY_API_KEY in the environment.
 *
 * Query params:
 *   query — free-text search string (min 3 chars, otherwise returns [])
 *
 * Returns: { suggestions: { label: string; lat: number; lng: number; isSpecific: boolean }[] }
 */

const GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode/autocomplete";
const MIN_QUERY_LENGTH = 3;

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
  /** True when the result points to a specific address/place rather than just a country/region. */
  isSpecific: boolean;
}

interface GeoapifyResult {
  formatted: string;
  lat: number;
  lon: number;
  result_type?: string;
}

// Broad, region-level result types that don't pin down a specific
// address/place (used to compute isSpecific for the 🌐 vs 📍 icon).
const BROAD_RESULT_TYPES = new Set(["country", "state", "county"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    console.error("Geocode suggest error: GEOAPIFY_API_KEY is not set.");
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const url = `${GEOAPIFY_URL}?text=${encodeURIComponent(query)}&format=json&limit=5&lang=en&apiKey=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Geocode suggest error: Geoapify returned ${res.status}`);
      return NextResponse.json({ suggestions: [] });
    }

    const data: { results?: GeoapifyResult[] } = await res.json();
    const results = data.results || [];

    const suggestions: GeocodeSuggestion[] = results
      .filter((r) => typeof r.lat === "number" && typeof r.lon === "number" && r.formatted)
      .map((r) => ({
        label: r.formatted,
        lat: r.lat,
        lng: r.lon,
        isSpecific: !BROAD_RESULT_TYPES.has(r.result_type || ""),
      }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Geocode suggest error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
