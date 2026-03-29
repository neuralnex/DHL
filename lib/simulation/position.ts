import {
  interpolateAlongPolylineKm,
  polylineLengthKm,
} from "./geo";

type LineStringPath = {
  type: "LineString";
  coordinates: [number, number][];
};

export interface PositionResult {
  lng: number;
  lat: number;
  segmentIndex: number;
  progress: number;
  mode: "road" | "air";
  phase: "pre_transit" | "in_transit" | "at_hub" | "delivered";
  currentLabel: string;
}

export interface SegmentForPosition {
  sequence: number;
  mode: "road" | "air";
  fromLabel?: string;
  path: LineStringPath;
}

export interface EventForPosition {
  segmentSequence: number | null;
  code: string;
  label: string;
  occurredAt: Date;
}

function interpolateAlongLineString(
  path: LineStringPath,
  t: number,
): { lng: number; lat: number } {
  const coords = path.coordinates;
  if (coords.length === 0) return { lng: 0, lat: 0 };
  if (coords.length === 1) {
    return { lng: coords[0][0], lat: coords[0][1] };
  }
  const tt = Math.min(1, Math.max(0, t));
  const totalKm = polylineLengthKm(coords);
  if (totalKm <= 0) {
    return { lng: coords[0][0], lat: coords[0][1] };
  }
  return interpolateAlongPolylineKm(coords, tt * totalKm);
}

function endOfSegment(seg: SegmentForPosition): { lng: number; lat: number } {
  const c = seg.path.coordinates;
  const last = c[c.length - 1] ?? c[0];
  return { lng: last[0], lat: last[1] };
}

function startOfSegment(seg: SegmentForPosition): { lng: number; lat: number } {
  const c = seg.path.coordinates[0];
  return { lng: c[0], lat: c[1] };
}

function boundsForSegment(
  segment: SegmentForPosition,
  events: EventForPosition[],
): { start: Date; end: Date } | null {
  const forSeg = events
    .filter((e) => e.segmentSequence === segment.sequence)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  if (forSeg.length === 0) return null;
  return {
    start: forSeg[0].occurredAt,
    end: forSeg[forSeg.length - 1].occurredAt,
  };
}

export function computePosition(
  segments: SegmentForPosition[],
  events: EventForPosition[],
  now: Date,
): PositionResult {
  const sorted = [...segments].sort((a, b) => a.sequence - b.sequence);
  const delivered = events.find((e) => e.code === "delivered");
  const created = events.find((e) => e.code === "created");

  if (delivered && now >= delivered.occurredAt) {
    const last = sorted[sorted.length - 1];
    const lastCoord = endOfSegment(last);
    return {
      lng: lastCoord.lng,
      lat: lastCoord.lat,
      segmentIndex: sorted.length - 1,
      progress: 1,
      mode: last.mode,
      phase: "delivered",
      currentLabel: delivered.label,
    };
  }

  if (created && now < created.occurredAt) {
    const first = sorted[0];
    const p = startOfSegment(first);
    return {
      lng: p.lng,
      lat: p.lat,
      segmentIndex: 0,
      progress: 0,
      mode: first.mode,
      phase: "pre_transit",
      currentLabel: "Awaiting pickup",
    };
  }

  const firstBounds = boundsForSegment(sorted[0], events);
  if (firstBounds && now < firstBounds.start) {
    const first = sorted[0];
    const p = startOfSegment(first);
    return {
      lng: p.lng,
      lat: p.lat,
      segmentIndex: 0,
      progress: 0,
      mode: first.mode,
      phase: "pre_transit",
      currentLabel: created?.label ?? "Shipment created",
    };
  }

  const bounds = sorted.map((s) => ({
    seg: s,
    b: boundsForSegment(s, events),
  }));

  for (let i = 0; i < bounds.length; i++) {
    const { seg, b } = bounds[i];
    if (!b) continue;
    const { start, end } = b;
    if (now >= start && now <= end) {
      const dur = end.getTime() - start.getTime();
      const prog =
        dur <= 0 ? 1 : (now.getTime() - start.getTime()) / dur;
      const pos = interpolateAlongLineString(seg.path, prog);
      const evs = events
        .filter(
          (e) =>
            e.segmentSequence === seg.sequence && e.occurredAt <= now,
        )
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
      const label = evs[0]?.label ?? seg.fromLabel ?? "In transit";
      return {
        lng: pos.lng,
        lat: pos.lat,
        segmentIndex: i,
        progress: prog,
        mode: seg.mode,
        phase: "in_transit",
        currentLabel: label,
      };
    }
  }

  for (let i = 0; i < bounds.length - 1; i++) {
    const b0 = bounds[i].b;
    const b1 = bounds[i + 1].b;
    if (!b0 || !b1) continue;
    if (now > b0.end && now < b1.start) {
      const p = endOfSegment(bounds[i].seg);
      return {
        lng: p.lng,
        lat: p.lat,
        segmentIndex: i,
        progress: 1,
        mode: bounds[i].seg.mode,
        phase: "at_hub",
        currentLabel: "Awaiting next leg",
      };
    }
  }

  const last = sorted[sorted.length - 1];
  const p = endOfSegment(last);
  return {
    lng: p.lng,
    lat: p.lat,
    segmentIndex: sorted.length - 1,
    progress: 1,
    mode: last.mode,
    phase: "in_transit",
    currentLabel: "In transit",
  };
}
