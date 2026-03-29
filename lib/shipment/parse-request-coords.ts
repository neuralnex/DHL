/**
 * Parse optional origin/destination coordinates from JSON bodies.
 * Supports nested objects and flat latitude/longitude fields.
 */

export function parseLatLngPair(
  lat: unknown,
  lng: unknown,
): { lng: number; lat: number } | null {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
  return { lat: la, lng: ln };
}

function coordsFromObject(obj: unknown): { lng: number; lat: number } | null {
  if (!obj || typeof obj !== "object") return null;
  const r = obj as Record<string, unknown>;
  return parseLatLngPair(
    r.lat ?? r.latitude,
    r.lng ?? r.longitude ?? r.lon,
  );
}

export function parseLatLngFromStrings(
  latStr: string,
  lngStr: string,
): { lng: number; lat: number } | null {
  const t = latStr.trim();
  const u = lngStr.trim();
  if (t === "" && u === "") return null;
  if (t === "" || u === "") return null;
  return parseLatLngPair(Number(t), Number(u));
}

export function parseShipmentCoordsFromBody(body: Record<string, unknown>): {
  originCoords: { lng: number; lat: number } | null;
  destinationCoords: { lng: number; lat: number } | null;
} {
  const originCoords =
    coordsFromObject(body.originCoords) ??
    parseLatLngPair(body.originLat ?? body.originLatitude, body.originLng ?? body.originLongitude);

  const destinationCoords =
    coordsFromObject(body.destinationCoords) ??
    parseLatLngPair(
      body.destinationLat ?? body.destinationLatitude,
      body.destinationLng ?? body.destinationLongitude,
    );

  return { originCoords, destinationCoords };
}
