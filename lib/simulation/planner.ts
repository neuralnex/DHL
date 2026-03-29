import {
  densifyArc,
  distanceKm,
  interpolateGreatCircle,
} from "./geo";
import {
  NODES,
  nearestAirportIdFromCoords,
  TRANSIT_HUB_AIRPORTS,
} from "./graph";
import type { PlannedEvent, PlannedSegment, RouteAnchor } from "./types";

function roadThroughPoints(
  points: { lng: number; lat: number }[],
  distKm: number,
  durationMinutes: number,
  fromLabel: string,
  toLabel: string,
  sequence: number,
): PlannedSegment {
  const a = points[0];
  const b = points[points.length - 1];
  const steps = Math.min(72, Math.max(18, Math.round(distKm / 8)));
  const coordinates = densifyArc(a, b, steps);
  return {
    sequence,
    mode: "road",
    fromLabel,
    toLabel,
    path: { type: "LineString", coordinates },
    distanceKm: distKm,
    durationMinutes,
  };
}

function airSegment(
  fromId: string,
  toId: string,
  sequence: number,
): PlannedSegment {
  const a = NODES[fromId];
  const b = NODES[toId];
  const dist = distanceKm(a, b);
  const steps = Math.min(112, Math.max(28, Math.round(dist / 350)));
  const coords = densifyArc(a, b, steps);
  return {
    sequence,
    mode: "air",
    fromLabel: a.label,
    toLabel: b.label,
    path: { type: "LineString", coordinates: coords },
    distanceKm: dist,
    durationMinutes: Math.max(75, Math.round((dist / 865) * 60)),
  };
}

function nearestHub(
  lng: number,
  lat: number,
  exclude: Set<string>,
): string {
  let bestId = TRANSIT_HUB_AIRPORTS[0];
  let bestKm = Infinity;
  const p = { lng, lat };
  for (const id of TRANSIT_HUB_AIRPORTS) {
    if (exclude.has(id)) continue;
    const n = NODES[id];
    const d = distanceKm(p, n);
    if (d < bestKm) {
      bestKm = d;
      bestId = id;
    }
  }
  return bestId;
}

function pickTwoHubs(oAirId: string, dAirId: string): [string, string] {
  const o = NODES[oAirId];
  const d = NODES[dAirId];
  const p1 = interpolateGreatCircle(o, d, 0.32);
  const p2 = interpolateGreatCircle(o, d, 0.68);
  const ex = new Set<string>([oAirId, dAirId]);
  const h1 = nearestHub(p1.lng, p1.lat, ex);
  ex.add(h1);
  const h2 = nearestHub(p2.lng, p2.lat, ex);
  return [h1, h2];
}

const STOP_OFFSET_FRAC = [0.06, 0.14, 0.28, 0.44, 0.58, 0.74, 0.88];

export function planGlobalRoute(
  origin: RouteAnchor,
  destination: RouteAnchor,
): {
  segments: PlannedSegment[];
  events: PlannedEvent[];
} {
  const oPt = { lng: origin.lng, lat: origin.lat };
  const dPt = { lng: destination.lng, lat: destination.lat };

  const oAirId = nearestAirportIdFromCoords(oPt);
  const dAirId = nearestAirportIdFromCoords(dPt);
  const oAir = NODES[oAirId];
  const dAir = NODES[dAirId];

  const [h1, h2] = pickTwoHubs(oAirId, dAirId);

  const roadToAirDist = distanceKm(oPt, oAir) * 1.08;
  const roadFromAirDist = distanceKm(dAir, dPt) * 1.08;

  const segments: PlannedSegment[] = [];
  let seq = 0;

  segments.push(
    roadThroughPoints(
      [oPt, oAir],
      roadToAirDist,
      Math.max(45, Math.round((roadToAirDist / 42) * 60)),
      origin.label,
      oAir.label,
      seq++,
    ),
  );

  const airLegs: [string, string][] = [[oAirId, h1]];
  if (h1 !== h2) {
    airLegs.push([h1, h2]);
  }
  airLegs.push([h2, dAirId]);

  for (const [a, b] of airLegs) {
    segments.push(airSegment(a, b, seq));
    seq++;
  }

  segments.push(
    roadThroughPoints(
      [dAir, dPt],
      roadFromAirDist,
      Math.max(40, Math.round((roadFromAirDist / 40) * 60)),
      dAir.label,
      destination.label,
      seq++,
    ),
  );

  const totalMin = segments.reduce((s, x) => s + x.durationMinutes, 0);
  const tStop = (frac: number) =>
    Math.min(totalMin - 12, Math.max(4, Math.round(totalMin * frac)));
  const tDelivered = Math.min(totalMin, Math.round(totalMin * 0.97));

  const lastSeg = segments.length - 1;
  const firstAirSeg = 1;
  const lastAirSeg = lastSeg - 1;
  const midAirSeg = firstAirSeg + Math.floor((lastAirSeg - firstAirSeg) / 2);
  const betweenAB = Math.min(firstAirSeg + 1, lastAirSeg);

  const stopSegments = [
    0,
    firstAirSeg,
    firstAirSeg,
    betweenAB,
    Math.min(midAirSeg + 1, lastAirSeg),
    lastSeg,
    lastSeg,
  ];

  const events: PlannedEvent[] = [
    {
      segmentSequence: null,
      code: "created",
      label: "Shipment created",
      offsetMinutes: 0,
      notifyEmail: true,
    },
    {
      segmentSequence: stopSegments[0],
      code: "stop_1",
      label: `Picked up — ${origin.label}`,
      offsetMinutes: tStop(STOP_OFFSET_FRAC[0]),
      notifyEmail: true,
    },
    {
      segmentSequence: stopSegments[1],
      code: "stop_2",
      label: `Departed export gateway — ${oAir.label}`,
      offsetMinutes: tStop(STOP_OFFSET_FRAC[1]),
      notifyEmail: true,
    },
    {
      segmentSequence: stopSegments[2],
      code: "stop_3",
      label: `Transit — ${NODES[h1].label}`,
      offsetMinutes: tStop(STOP_OFFSET_FRAC[2]),
      notifyEmail: true,
    },
    {
      segmentSequence: stopSegments[3],
      code: "stop_4",
      label:
        h1 === h2
          ? `En route — long-haul segment`
          : `Transit connection — ${NODES[h2].label}`,
      offsetMinutes: tStop(STOP_OFFSET_FRAC[3]),
      notifyEmail: false,
    },
    {
      segmentSequence: stopSegments[4],
      code: "stop_5",
      label: `Arrival gateway — ${dAir.label}`,
      offsetMinutes: tStop(STOP_OFFSET_FRAC[4]),
      notifyEmail: true,
    },
    {
      segmentSequence: stopSegments[5],
      code: "stop_6",
      label: `Sort facility — ${destination.label}`,
      offsetMinutes: tStop(STOP_OFFSET_FRAC[5]),
      notifyEmail: true,
    },
    {
      segmentSequence: stopSegments[6],
      code: "stop_7",
      label: "Out for delivery",
      offsetMinutes: tStop(STOP_OFFSET_FRAC[6]),
      notifyEmail: true,
    },
    {
      segmentSequence: lastSeg,
      code: "delivered",
      label: "Delivered",
      offsetMinutes: tDelivered,
      notifyEmail: true,
    },
  ];

  return { segments, events };
}
