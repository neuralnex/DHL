export type GeoSuggestion = { label: string; lng: number; lat: number };

type MapboxGeocodeJson = {
  features?: Array<{
    place_name?: string;
    center?: [number, number];
    geometry?: { type?: string; coordinates?: [number, number] };
  }>;
};

export function parseMapboxGeocodeFeatures(j: unknown): GeoSuggestion[] {
  const data = j as MapboxGeocodeJson;
  return (data.features ?? [])
    .map((f) => {
      const lng = f.center?.[0] ?? f.geometry?.coordinates?.[0];
      const lat = f.center?.[1] ?? f.geometry?.coordinates?.[1];
      return {
        label: f.place_name?.trim() ?? "",
        lng: Number(lng),
        lat: Number(lat),
      };
    })
    .filter((x) => x.label && Number.isFinite(x.lng) && Number.isFinite(x.lat))
    .slice(0, 8);
}

export function mapboxForwardGeocodeUrl(query: string, accessToken: string): string {
  const q = query.trim();
  const base = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`;
  const params = new URLSearchParams({
    access_token: accessToken,
    limit: "8",
    language: "en",
  });
  return `${base}?${params.toString()}`;
}

export function mapboxReverseGeocodeUrl(
  lng: number,
  lat: number,
  accessToken: string,
): string {
  const path = `${lng},${lat}`;
  const base = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(path)}.json`;
  const params = new URLSearchParams({
    access_token: accessToken,
    limit: "1",
  });
  return `${base}?${params.toString()}`;
}

export async function reverseGeocodePlaceName(
  lng: number,
  lat: number,
  accessToken: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = mapboxReverseGeocodeUrl(lng, lat, accessToken);
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const j = (await res.json()) as MapboxGeocodeJson;
  const name = j.features?.[0]?.place_name?.trim();
  return name || null;
}
