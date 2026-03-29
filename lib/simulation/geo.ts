export function distanceKm(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function interpolateGreatCircle(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
  t: number,
): { lng: number; lat: number } {
  if (t <= 0) return { ...a };
  if (t >= 1) return { ...b };
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const λ1 = (a.lng * Math.PI) / 180;
  const λ2 = (b.lng * Math.PI) / 180;
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
      ),
    );
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x =
    A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y =
    A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  const φ3 = Math.atan2(z, Math.sqrt(x ** 2 + y ** 2));
  const λ3 = Math.atan2(y, x);
  return { lat: (φ3 * 180) / Math.PI, lng: (λ3 * 180) / Math.PI };
}

export function densifyArc(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
  steps: number,
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const p = interpolateGreatCircle(a, b, i / steps);
    coords.push([p.lng, p.lat]);
  }
  return coords;
}

export function polylineLengthKm(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    sum += distanceKm(
      { lng: coords[i][0], lat: coords[i][1] },
      { lng: coords[i + 1][0], lat: coords[i + 1][1] },
    );
  }
  return sum;
}

export function interpolateAlongPolylineKm(
  coords: [number, number][],
  distanceAlongKm: number,
): { lng: number; lat: number } {
  if (coords.length === 0) return { lng: 0, lat: 0 };
  if (coords.length === 1) {
    return { lng: coords[0][0], lat: coords[0][1] };
  }
  let remaining = Math.max(0, distanceAlongKm);
  for (let i = 0; i < coords.length - 1; i++) {
    const a = { lng: coords[i][0], lat: coords[i][1] };
    const b = { lng: coords[i + 1][0], lat: coords[i + 1][1] };
    const segKm = distanceKm(a, b);
    if (segKm === 0) continue;
    if (remaining <= segKm) {
      const t = remaining / segKm;
      return {
        lng: a.lng + (b.lng - a.lng) * t,
        lat: a.lat + (b.lat - a.lat) * t,
      };
    }
    remaining -= segKm;
  }
  const last = coords[coords.length - 1];
  return { lng: last[0], lat: last[1] };
}
