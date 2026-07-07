import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/vets/search
 *
 * Live veterinary clinic search backed by OpenStreetMap data:
 *   - Nominatim geocodes a free-text location query into lat/lng
 *   - Overpass API is then queried for amenity=veterinary POIs
 *     within a radius of that point
 *
 * Query params:
 *   query   — free-text location (city, address, etc.) — required unless lat/lng given
 *   lat,lng — coordinates to search around directly (e.g. from the browser's Geolocation API)
 *   radius  — search radius in meters (default 15000, max 50000)
 *
 * Returns: { vets: VetResult[], center: { lat, lng }, resolvedAddress?: string }
 */

const PHOTON_URL = "https://photon.komoot.io/api/";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Identify ourselves per Overpass usage policy
const USER_AGENT = "Purrdict/1.0 (hackathon project; contact: purrdict@example.com)";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface VetResult {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  hours: string | null;
  website: string | null;
  emoji: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:state"],
    tags["addr:country"],
  ].filter((p) => p && p.trim().length > 0);
  return parts.length > 0 ? parts.join(", ") : "Address unavailable";
}

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

function buildPhotonLabel(props: PhotonFeature["properties"]): string {
  const parts = [
    [props.housenumber, props.street].filter(Boolean).join(" ") || props.name,
    props.district,
    props.city || props.town || props.village,
    props.state,
    props.country,
  ].filter((p) => p && p.trim().length > 0);
  return parts.join(", ");
}

// Geocodes via Photon (https://photon.komoot.io) rather than Nominatim —
// Nominatim's usage policy forbids the kind of repeated, app-triggered
// queries this search box generates, so the whole app standardizes on
// Photon for free-text -> coordinates lookups.
async function geocodeQuery(q: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&limit=1&lang=en`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data: { features?: PhotonFeature[] } = await res.json();
  const feature = data.features?.[0];
  if (!feature || feature.geometry?.coordinates?.length !== 2) return null;
  const [lng, lat] = feature.geometry.coordinates;
  const displayName = buildPhotonLabel(feature.properties) || q;
  return { lat, lng, displayName };
}

async function searchVetsNearby(lat: number, lng: number, radiusMeters: number): Promise<VetResult[]> {
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
      way["amenity"="veterinary"](around:${radiusMeters},${lat},${lng});
    );
    out center 40;
  `.trim();

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: `data=${encodeURIComponent(overpassQuery)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass API returned ${res.status}`);
  }

  const data = await res.json();
  const elements: OverpassElement[] = data.elements || [];

  const vets: VetResult[] = elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (elLat === undefined || elLng === undefined) return null;

      const tags = el.tags || {};
      const hours = tags.opening_hours || null;
      const isEmergency = hours === "24/7" || /emergency/i.test(tags.name || "");

      const vet: VetResult = {
        id: `${el.type}/${el.id}`,
        name: tags.name || "Veterinary Clinic",
        address: buildAddress(tags),
        phone: tags.phone || tags["contact:phone"] || null,
        hours,
        website: tags.website || tags["contact:website"] || null,
        emoji: isEmergency ? "🚨" : "🏥",
        lat: elLat,
        lng: elLng,
        distanceMeters: Math.round(haversineMeters(lat, lng, elLat, elLng)),
      };
      return vet;
    })
    .filter((v): v is VetResult => v !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return vets;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const radiusParam = searchParams.get("radius");

    const radiusMeters = Math.min(
      Math.max(parseInt(radiusParam || "15000", 10) || 15000, 1000),
      50000
    );

    let lat: number;
    let lng: number;
    let resolvedAddress: string | undefined;

    if (latParam && lngParam) {
      lat = parseFloat(latParam);
      lng = parseFloat(lngParam);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return NextResponse.json({ error: "Invalid lat/lng." }, { status: 400 });
      }
    } else if (query) {
      const geocoded = await geocodeQuery(query);
      if (!geocoded) {
        return NextResponse.json(
          { error: "Could not find that location. Try a more specific search." },
          { status: 404 }
        );
      }
      lat = geocoded.lat;
      lng = geocoded.lng;
      resolvedAddress = geocoded.displayName;
    } else {
      return NextResponse.json(
        { error: "Provide either a query, or lat and lng." },
        { status: 400 }
      );
    }

    const vets = await searchVetsNearby(lat, lng, radiusMeters);

    return NextResponse.json({
      vets,
      center: { lat, lng },
      resolvedAddress,
    });
  } catch (error) {
    console.error("Vet search error:", error);
    return NextResponse.json(
      { error: "Failed to search for nearby vets. Please try again." },
      { status: 500 }
    );
  }
}
