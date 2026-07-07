import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode/resolve
 *
 * One-shot address -> coordinates lookup, backed by Photon
 * (https://photon.komoot.io). Used for the "final" geocode when a user
 * explicitly submits an address (Search / Save Home buttons), as opposed
 * to the live-typing suggestions in /api/geocode/suggest.
 *
 * We use Photon here (rather than Nominatim) so the whole app talks to a
 * single geocoding backend — Nominatim's usage policy bans autocomplete
 * use entirely, and mixing the two for different endpoints risks the same
 * User-Agent/IP getting throttled or blocked across all of them.
 *
 * Query params:
 *   query — free-text address/place (required)
 *
 * Returns: { result: { label: string; lat: number; lng: number; isSpecific: boolean } | null }
 */

const PHOTON_URL = "https://photon.komoot.io/api/";

interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

function buildLabel(props: PhotonFeature["properties"]): string {
  const parts = [
    [props.housenumber, props.street].filter(Boolean).join(" ") || props.name,
    props.district,
    props.city || props.town || props.village,
    props.state,
    props.country,
  ].filter((p) => p && p.trim().length > 0);
  return parts.join(", ");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";

  if (!query) {
    return NextResponse.json({ error: "Provide a query." }, { status: 400 });
  }

  try {
    const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=1&lang=en`;
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ result: null });
    }

    const data: { features?: PhotonFeature[] } = await res.json();
    const feature = data.features?.[0];

    if (!feature || feature.geometry?.coordinates?.length !== 2) {
      return NextResponse.json({ result: null });
    }

    const [lng, lat] = feature.geometry.coordinates;
    const isSpecific = Boolean(
      feature.properties.housenumber || feature.properties.street ||
      feature.properties.city || feature.properties.town || feature.properties.village
    );
    const label = buildLabel(feature.properties);

    if (!label) {
      return NextResponse.json({ result: null });
    }

    return NextResponse.json({ result: { label, lat, lng, isSpecific } });
  } catch (error) {
    console.error("Geocode resolve error:", error);
    return NextResponse.json({ result: null });
  }
}
