"use client";

import { reverseGeocodePlaceName } from "@/lib/geo/mapbox-geocode";
import { TrackingMap } from "@/components/TrackingMap";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TrackingResponse = {
  shipment: {
    trackingNumber: string;
    referenceCode: string | null;
    originLabel: string;
    destinationLabel: string;
    originCoords: { lng: number; lat: number } | null;
    destinationCoords: { lng: number; lat: number } | null;
    customerName: string | null;
    serviceLevel: string | null;
    weightKg: number;
    estimatedDeliveryAt: string;
    createdAt: string;
    status: string;
  };
  segments: {
    sequence: number;
    mode: "road" | "air";
    fromLabel: string;
    toLabel: string;
    path: { type: "LineString"; coordinates: [number, number][] };
  }[];
  events: {
    id: string;
    label: string;
    occurredAt: string;
    code: string;
    confirmed: boolean;
  }[];
};

type PositionResponse = {
  position: {
    lng: number;
    lat: number;
    segmentIndex: number;
    progress: number;
    mode: "road" | "air";
    phase: string;
    currentLabel: string;
  };
};

export default function TrackPage() {
  const params = useParams();
  const trackingNumber = decodeURIComponent(
    String(params.trackingNumber ?? ""),
  );
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  const [data, setData] = useState<TrackingResponse | null>(null);
  const [pos, setPos] = useState<PositionResponse["position"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [originPlaceName, setOriginPlaceName] = useState<string | null>(null);
  const [destinationPlaceName, setDestinationPlaceName] = useState<
    string | null
  >(null);

  function formatLatLng(c: { lng: number; lat: number }): string {
    return `${c.lat.toFixed(4)}°, ${c.lng.toFixed(4)}°`;
  }

  function formatPartyTime(iso: string): string {
    const d = new Date(iso);
    const diffMin = Math.round((nowMs - d.getTime()) / 60000);
    const relative =
      diffMin <= 0
        ? "just now"
        : diffMin < 60
          ? `${diffMin} min ago`
          : `${Math.round(diffMin / 60)} hr ago`;
    const local = d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const utc = d.toLocaleString("en-GB", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `${relative} · Local ${local} · UTC ${utc}`;
  }

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!mapboxAccessToken || !data?.shipment) {
      setOriginPlaceName(null);
      setDestinationPlaceName(null);
      return;
    }
    const s = data.shipment;
    const ctrl = new AbortController();
    void (async () => {
      if (s.originCoords) {
        const n = await reverseGeocodePlaceName(
          s.originCoords.lng,
          s.originCoords.lat,
          mapboxAccessToken,
          ctrl.signal,
        );
        if (!ctrl.signal.aborted) setOriginPlaceName(n);
      } else {
        setOriginPlaceName(null);
      }
      if (s.destinationCoords) {
        const n = await reverseGeocodePlaceName(
          s.destinationCoords.lng,
          s.destinationCoords.lat,
          mapboxAccessToken,
          ctrl.signal,
        );
        if (!ctrl.signal.aborted) setDestinationPlaceName(n);
      } else {
        setDestinationPlaceName(null);
      }
    })();
    return () => ctrl.abort();
  }, [data, mapboxAccessToken]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/tracking/${encodeURIComponent(trackingNumber)}`,
        );
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Not found");
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Load failed");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(
          `/api/tracking/${encodeURIComponent(trackingNumber)}/position`,
        );
        const j = await res.json();
        if (res.ok && !cancelled) setPos(j.position);
      } catch {}
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [trackingNumber]);

  const paths = useMemo(() => {
    if (!data?.segments) return [];
    return [...data.segments]
      .sort((a, b) => a.sequence - b.sequence)
      .map((s) => ({
        coordinates: s.path.coordinates,
        mode: s.mode,
      }));
  }, [data]);

  const marker = useMemo(() => {
    if (pos) return { lng: pos.lng, lat: pos.lat };
    if (paths[0]?.coordinates?.[0]) {
      const c = paths[0].coordinates[0];
      return { lng: c[0], lat: c[1] };
    }
    return { lng: 0, lat: 20 };
  }, [pos, paths]);

  if (err) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <p className="text-red-600">{err}</p>
        <Link
          href="/track"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Try another tracking number
        </Link>
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-600">Loading…</p>;
  }

  const s = data.shipment;

  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-6 md:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
            Shipment tracking
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-white md:text-3xl">
              {s.trackingNumber}
            </h1>
            {s.referenceCode && (
              <span className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-sm text-white">
                Ref. {s.referenceCode}
              </span>
            )}
          </div>
          {s.customerName && (
            <p className="mt-2 text-sm text-blue-50">{s.customerName}</p>
          )}
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">
              Route
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-gray-900">
              {s.originLabel}
              <span className="mx-1 text-gray-500">→</span>
              {s.destinationLabel}
            </p>
            {(s.originCoords || s.destinationCoords) && (
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {s.originCoords && (
                  <p>
                    <span className="font-mono">
                      From: {formatLatLng(s.originCoords)}
                    </span>
                    {originPlaceName && (
                      <span className="mt-0.5 block font-sans text-gray-800">
                        Place: {originPlaceName}
                      </span>
                    )}
                  </p>
                )}
                {s.destinationCoords && (
                  <p>
                    <span className="font-mono">
                      To: {formatLatLng(s.destinationCoords)}
                    </span>
                    {destinationPlaceName && (
                      <span className="mt-0.5 block font-sans text-gray-800">
                        Place: {destinationPlaceName}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">
              Service
            </p>
            <p className="mt-1 text-sm text-gray-900">{s.serviceLevel ?? "Standard"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">
              Weight
            </p>
            <p className="mt-1 text-sm text-gray-900">{s.weightKg} kg</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">
              Est. delivery
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {formatPartyTime(s.estimatedDeliveryAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4 text-sm md:px-8">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold capitalize text-blue-800">
            {s.status.replace(/_/g, " ")}
          </span>
          {pos && (
            <span className="text-gray-600">
              Current:{" "}
              <span className="font-medium text-gray-900">{pos.currentLabel}</span>
              {" · "}
              {pos.mode === "air" ? "Air" : "Road"}
            </span>
          )}
        </div>
      </div>

      <TrackingMap
        paths={paths}
        marker={marker}
        mapboxAccessToken={mapboxAccessToken}
      />

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Activity</h2>
        <ul className="space-y-4 border-l-2 border-gray-200 pl-6">
          {data.events.map((e) => {
            const isShippedDay = e.code === "created";
            const isConfirmed = e.confirmed;
            return (
              <li key={e.id} className="relative">
                <span
                  className={`absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${
                    isConfirmed ? "bg-green-500" : "bg-amber-400"
                  }`}
                />
                <p className="font-medium leading-snug text-gray-900">{e.label}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {isShippedDay
                    ? `Shipped: ${formatPartyTime(e.occurredAt)}`
                    : isConfirmed
                      ? `Confirmed: ${formatPartyTime(e.occurredAt)}`
                      : "Pending confirmation"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <Link
        href="/track"
        className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
      >
        Track another shipment
      </Link>
    </div>
  );
}
