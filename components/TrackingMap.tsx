"use client";

import type { Feature, FeatureCollection, LineString } from "geojson";
import type { GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  along,
  bbox,
  featureCollection,
  length,
  lineString,
} from "@turf/turf";

function maxZoomForSpan(latSpan: number, lngSpan: number): number {
  const span = Math.max(latSpan, lngSpan);
  if (span > 90) return 2;
  if (span > 55) return 2.4;
  if (span > 35) return 2.9;
  if (span > 20) return 3.6;
  if (span > 10) return 4.8;
  if (span > 4) return 6;
  return 7;
}

const ANIMATION_STEPS = 480;

function buildRouteArc(
  paths: { coordinates: [number, number][]; mode: "road" | "air" }[],
): [number, number][] {
  const coords: [number, number][] = [];
  for (const p of paths) {
    for (const c of p.coordinates) {
      if (
        coords.length === 0 ||
        coords[coords.length - 1][0] !== c[0] ||
        coords[coords.length - 1][1] !== c[1]
      ) {
        coords.push(c);
      }
    }
  }
  if (coords.length < 2) return coords;

  const line = lineString(coords);
  const lineKm = length(line, { units: "kilometers" });
  if (!Number.isFinite(lineKm) || lineKm <= 0) return coords;

  const arc: [number, number][] = [];
  const steps = Math.min(ANIMATION_STEPS, Math.max(48, Math.ceil(lineKm * 80)));
  for (let i = 0; i <= steps; i++) {
    const d = (i / steps) * lineKm;
    const pt = along(line, d, { units: "kilometers" });
    arc.push(pt.geometry.coordinates as [number, number]);
  }
  return arc;
}

export function TrackingMap(props: {
  paths: { coordinates: [number, number][]; mode: "road" | "air" }[];
  marker: { lng: number; lat: number };
  mapboxAccessToken: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const replayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const counterRef = useRef(0);
  const didFitRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [replayTick, setReplayTick] = useState(0);

  const routeArc = useMemo(
    () => buildRouteArc(props.paths),
    [props.paths],
  );

  const stopAnimation = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    replayingRef.current = false;
  }, []);

  const initialCenterRef = useRef(props.marker);

  useEffect(() => {
    if (!props.mapboxAccessToken || !containerRef.current) return;

    let cancelled = false;
    let map: import("mapbox-gl").Map | null = null;

    void (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = props.mapboxAccessToken;

      const c = initialCenterRef.current;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/standard",
        ...( {
          config: {
            basemap: {
              theme: "monochrome",
              lightPreset: "night",
            },
          },
        } as Record<string, unknown>),
        center: [c.lng, c.lat],
        zoom: 2,
        pitch: 38,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        if (!map) return;

        map.addSource("routes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "routes-line",
          type: "line",
          source: "routes",
          paint: {
            "line-width": 3,
            "line-opacity": 0.9,
            "line-color": [
              "match",
              ["get", "mode"],
              "air",
              "#38bdf8",
              "#fbbf24",
            ],
          },
        });

        map.addSource("vehicle", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [props.marker.lng, props.marker.lat],
            },
          },
        });
        map.addLayer({
          id: "vehicle",
          type: "circle",
          source: "vehicle",
          paint: {
            "circle-radius": 7,
            "circle-color": "#2563eb",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      stopAnimation();
      didFitRef.current = false;
      setMapReady(false);
      map?.remove();
      mapRef.current = null;
    };
  }, [props.mapboxAccessToken, stopAnimation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const features: Feature<LineString>[] = props.paths.map((p) => ({
      type: "Feature",
      properties: { mode: p.mode },
      geometry: {
        type: "LineString",
        coordinates: p.coordinates,
      },
    }));

    const fc: FeatureCollection = featureCollection(features);
    const src = map.getSource("routes") as GeoJSONSource | undefined;
    src?.setData(fc);

    if (!didFitRef.current && features.length > 0) {
      try {
        const box = bbox(fc);
        const sw: [number, number] = [box[0], box[1]];
        const ne: [number, number] = [box[2], box[3]];
        const latSpan = Math.abs(ne[1] - sw[1]);
        const lngSpan = Math.abs(ne[0] - sw[0]);
        const maxZoom = maxZoomForSpan(latSpan, lngSpan);
        map.fitBounds([sw, ne], {
          padding: { top: 56, bottom: 56, left: 56, right: 56 },
          maxZoom,
          duration: 600,
        });
      } catch {
        map.flyTo({
          center: [props.marker.lng, props.marker.lat],
          zoom: 4,
        });
      }
      didFitRef.current = true;
    }
  }, [mapReady, props.paths, props.marker.lng, props.marker.lat]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || replayingRef.current) return;
    const src = map.getSource("vehicle") as GeoJSONSource | undefined;
    if (!src) return;
    src.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [props.marker.lng, props.marker.lat],
      },
    });
  }, [mapReady, props.marker.lng, props.marker.lat, replayTick]);

  const runReplay = useCallback(() => {
    const map = mapRef.current;
    if (!mapReady || !map || replayingRef.current) return;

    const arc = routeArc;
    if (arc.length < 2) return;

    stopAnimation();
    replayingRef.current = true;
    counterRef.current = 0;

    function tick() {
      const m = mapRef.current;
      if (!m || !replayingRef.current) return;

      const vehicleSrc = m.getSource("vehicle") as GeoJSONSource;
      const i = counterRef.current;
      const coord = arc[Math.min(i, arc.length - 1)];
      if (!coord) {
        replayingRef.current = false;
        setReplayTick((t) => t + 1);
        return;
      }

      vehicleSrc.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: coord },
      });

      if (i >= arc.length - 1) {
        replayingRef.current = false;
        setReplayTick((t) => t + 1);
        return;
      }

      counterRef.current = i + 1;
      rafRef.current = requestAnimationFrame(tick);
    }

    counterRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [mapReady, routeArc, stopAnimation]);

  if (!props.mapboxAccessToken) {
    return (
      <div className="flex h-[min(520px,70vh)] min-h-[360px] w-full items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-4 text-center text-sm text-amber-900">
        Set{" "}
        <code className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono text-xs text-gray-800 shadow-sm">
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        </code>{" "}
        in <code className="font-mono text-xs">.env</code> to show the live map
        (get a token at mapbox.com).
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[min(520px,70vh)] min-h-[360px] w-full overflow-hidden rounded-2xl border border-gray-100 shadow-lg"
      />
      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <button
          type="button"
          onClick={runReplay}
          disabled={!mapReady || routeArc.length < 2}
          className="pointer-events-auto rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-white"
        >
          Replay route
        </button>
      </div>
    </div>
  );
}
