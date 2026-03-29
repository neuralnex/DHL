import {
  AIRPORT_FOR_CITY,
  NODES,
  nearestAirportIdFromCoords,
} from "./graph";
import { distanceKm } from "./geo";
import type { RouteAnchor } from "./types";

const RULES: { match: RegExp; cityId: string }[] = [
  { match: /singapore/i, cityId: "singapore_city" },
  { match: /dubai/i, cityId: "dubai_city" },
  { match: /paris/i, cityId: "paris_city" },
  { match: /london/i, cityId: "london_city" },
  { match: /frankfurt/i, cityId: "frankfurt_city" },
  { match: /tokyo/i, cityId: "tokyo_city" },
  { match: /sydney/i, cityId: "sydney_city" },
  { match: /los angeles|l\.a\.|lax/i, cityId: "los_angeles_city" },
  { match: /new york|nyc|brooklyn|manhattan/i, cityId: "new_york_city" },
  { match: /são paulo|sao paulo/i, cityId: "sao_paulo_city" },
  { match: /mumbai|bombay/i, cityId: "mumbai_city" },
  { match: /cairo/i, cityId: "cairo_city" },
  { match: /johannesburg/i, cityId: "johannesburg_city" },
  { match: /lagos/i, cityId: "lagos_city" },
  { match: /amsterdam/i, cityId: "frankfurt_city" },
  { match: /accra|ghana/i, cityId: "accra_city" },
  { match: /lima|peru/i, cityId: "lima_city" },
  { match: /nairobi|kenya/i, cityId: "nairobi_city" },
];

const DEFAULT_ORIGIN = "singapore_city";
const DEFAULT_DEST = "los_angeles_city";
const CITY_NODE_IDS = Object.keys(NODES).filter((id) => id.endsWith("_city"));

function hashText(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fallbackCityFromLabel(label: string): string {
  if (CITY_NODE_IDS.length === 0) return DEFAULT_ORIGIN;
  const t = label.trim().toLowerCase();
  if (!t) return DEFAULT_ORIGIN;
  const idx = hashText(t) % CITY_NODE_IDS.length;
  return CITY_NODE_IDS[idx];
}

export function resolveCityNodeId(label: string): string {
  const t = label.trim();
  if (!t) return DEFAULT_ORIGIN;
  for (const { match, cityId } of RULES) {
    if (match.test(t)) return cityId;
  }
  const lower = t.toLowerCase();
  for (const id of Object.keys(NODES)) {
    if (!id.endsWith("_city")) continue;
    const node = NODES[id];
    if (lower.includes(node.label.toLowerCase())) return id;
  }
  return fallbackCityFromLabel(t);
}

function nearestCityFromCoords(p: { lng: number; lat: number }): string {
  let bestId = DEFAULT_ORIGIN;
  let bestKm = Number.POSITIVE_INFINITY;
  for (const [id, node] of Object.entries(NODES)) {
    if (!id.endsWith("_city")) continue;
    const km = distanceKm(p, node);
    if (km < bestKm) {
      bestKm = km;
      bestId = id;
    }
  }
  return bestId;
}

function anchorFromLabelAndCoords(
  label: string,
  coords: { lng: number; lat: number } | null | undefined,
): { anchor: RouteAnchor; cityId: string } {
  const trimmed = label.trim() || "Location";
  if (
    coords &&
    Number.isFinite(coords.lng) &&
    Number.isFinite(coords.lat) &&
    Math.abs(coords.lat) <= 90 &&
    Math.abs(coords.lng) <= 180
  ) {
    return {
      anchor: { lng: coords.lng, lat: coords.lat, label: trimmed },
      cityId: nearestCityFromCoords(coords),
    };
  }
  const cityId = resolveCityNodeId(label);
  const n = NODES[cityId];
  return {
    anchor: { lng: n.lng, lat: n.lat, label: trimmed },
    cityId,
  };
}

export function resolveRouteAnchors(
  originLabel: string,
  destinationLabel: string,
  opts?: {
    originCoords?: { lng: number; lat: number } | null;
    destinationCoords?: { lng: number; lat: number } | null;
  },
): {
  origin: RouteAnchor;
  destination: RouteAnchor;
  originCityId: string;
  destCityId: string;
} {
  const o = anchorFromLabelAndCoords(originLabel, opts?.originCoords ?? null);
  let d = anchorFromLabelAndCoords(destinationLabel, opts?.destinationCoords ?? null);

  const km = distanceKm(
    { lng: o.anchor.lng, lat: o.anchor.lat },
    { lng: d.anchor.lng, lat: d.anchor.lat },
  );
  if (km < 2) {
    const fallbackId =
      d.cityId === DEFAULT_ORIGIN ? DEFAULT_DEST : DEFAULT_ORIGIN;
    const n = NODES[fallbackId];
    d = {
      anchor: {
        lng: n.lng,
        lat: n.lat,
        label: d.anchor.label,
      },
      cityId: fallbackId,
    };
  }

  return {
    origin: o.anchor,
    destination: d.anchor,
    originCityId: o.cityId,
    destCityId: d.cityId,
  };
}

export function resolveOriginDestination(
  originLabel: string,
  destinationLabel: string,
  opts?: {
    originCoords?: { lng: number; lat: number } | null;
    destinationCoords?: { lng: number; lat: number } | null;
  },
): { originCityId: string; destCityId: string } {
  const r = resolveRouteAnchors(originLabel, destinationLabel, opts);
  return { originCityId: r.originCityId, destCityId: r.destCityId };
}

export function airportForCity(cityId: string): string {
  const mapped = AIRPORT_FOR_CITY[cityId];
  if (mapped) return mapped;
  const node = NODES[cityId];
  if (node) return nearestAirportIdFromCoords(node);
  return "dxb_airport";
}
