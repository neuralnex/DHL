export type MapboxDirectionsProfile =
  | "driving"
  | "driving-traffic"
  | "walking"
  | "cycling";

type DirectionsJson = {
  routes?: Array<{
    geometry?: { type?: string; coordinates?: [number, number][] };
  }>;
};

export function mapboxDirectionsUrl(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
  accessToken: string,
  profile: MapboxDirectionsProfile = "driving",
): string {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const path = `mapbox/${profile}/${coords}`;
  const base = `https://api.mapbox.com/directions/v5/${path}`;
  const params = new URLSearchParams({
    access_token: accessToken,
    geometries: "geojson",
    overview: "full",
  });
  return `${base}?${params.toString()}`;
}

export async function fetchDrivingRouteCoordinates(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
  accessToken: string,
  options?: {
    profile?: MapboxDirectionsProfile;
    signal?: AbortSignal;
  },
): Promise<[number, number][] | null> {
  const url = mapboxDirectionsUrl(
    origin,
    destination,
    accessToken,
    options?.profile ?? "driving",
  );
  const res = await fetch(url, { signal: options?.signal });
  if (!res.ok) return null;
  const j = (await res.json()) as DirectionsJson;
  const coords = j.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) return null;
  return coords;
}
