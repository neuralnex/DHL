export type TransportMode = "road" | "air";

export type RouteAnchor = {
  lng: number;
  lat: number;
  label: string;
};

export interface SimNode {
  id: string;
  label: string;
  lng: number;
  lat: number;
}

export interface PlannedSegment {
  sequence: number;
  mode: TransportMode;
  fromLabel: string;
  toLabel: string;
  path: { type: "LineString"; coordinates: [number, number][] };
  distanceKm: number;
  durationMinutes: number;
}

export interface PlannedEvent {
  segmentSequence: number | null;
  code: string;
  label: string;
  offsetMinutes: number;
  notifyEmail: boolean;
}
