"use client";

import {
  mapboxForwardGeocodeUrl,
  parseMapboxGeocodeFeatures,
  reverseGeocodePlaceName,
  type GeoSuggestion,
} from "@/lib/geo/mapbox-geocode";
import { parseLatLngFromStrings } from "@/lib/shipment/parse-request-coords";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const POPULAR_LOCATIONS = [
  "Dubai, United Arab Emirates",
  "Doha, Qatar",
  "Singapore",
  "Tokyo, Japan",
  "Hong Kong",
  "Seoul, South Korea",
  "Bangkok, Thailand",
  "Mumbai, India",
  "Delhi, India",
  "Shanghai, China",
  "London, United Kingdom",
  "Paris, France",
  "Frankfurt, Germany",
  "Amsterdam, Netherlands",
  "Madrid, Spain",
  "Zurich, Switzerland",
  "Istanbul, Turkey",
  "Tel Aviv, Israel",
  "Cairo, Egypt",
  "Nairobi, Kenya",
  "Lagos, Nigeria",
  "Johannesburg, South Africa",
  "Addis Ababa, Ethiopia",
  "Accra, Ghana",
  "São Paulo, Brazil",
  "Lima, Peru",
  "Bogotá, Colombia",
  "Buenos Aires, Argentina",
  "Santiago, Chile",
  "Mexico City, Mexico",
  "New York, USA",
  "Los Angeles, USA",
  "Chicago, USA",
  "Atlanta, USA",
  "Vancouver, Canada",
  "Sydney, Australia",
  "Melbourne, Australia",
];

export default function BethShipPage() {
  const router = useRouter();
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const [originLabel, setOriginLabel] = useState("Accra, Ghana");
  const [destinationLabel, setDestinationLabel] = useState("Lima, Peru");
  const [originCoords, setOriginCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<GeoSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeoSuggestion[]>([]);
  const [receiverEmail, setReceiverEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [serviceLevel, setServiceLevel] = useState("Standard");
  const [internalNotes, setInternalNotes] = useState("");
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState("");
  const [weightKg, setWeightKg] = useState("2.5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originResolvedPlace, setOriginResolvedPlace] = useState<string | null>(
    null,
  );
  const [destinationResolvedPlace, setDestinationResolvedPlace] = useState<
    string | null
  >(null);
  const [originLatManual, setOriginLatManual] = useState("");
  const [originLngManual, setOriginLngManual] = useState("");
  const [destinationLatManual, setDestinationLatManual] = useState("");
  const [destinationLngManual, setDestinationLngManual] = useState("");

  const effectiveOriginCoords = useMemo(
    () =>
      parseLatLngFromStrings(originLatManual, originLngManual) ?? originCoords,
    [originLatManual, originLngManual, originCoords],
  );
  const effectiveDestinationCoords = useMemo(
    () =>
      parseLatLngFromStrings(destinationLatManual, destinationLngManual) ??
      destinationCoords,
    [destinationLatManual, destinationLngManual, destinationCoords],
  );

  useEffect(() => {
    if (!mapboxAccessToken || !effectiveOriginCoords) {
      setOriginResolvedPlace(null);
      return;
    }
    const ctrl = new AbortController();
    void (async () => {
      const n = await reverseGeocodePlaceName(
        effectiveOriginCoords.lng,
        effectiveOriginCoords.lat,
        mapboxAccessToken,
        ctrl.signal,
      );
      if (!ctrl.signal.aborted) setOriginResolvedPlace(n);
    })();
    return () => ctrl.abort();
  }, [mapboxAccessToken, effectiveOriginCoords]);

  useEffect(() => {
    if (!mapboxAccessToken || !effectiveDestinationCoords) {
      setDestinationResolvedPlace(null);
      return;
    }
    const ctrl = new AbortController();
    void (async () => {
      const n = await reverseGeocodePlaceName(
        effectiveDestinationCoords.lng,
        effectiveDestinationCoords.lat,
        mapboxAccessToken,
        ctrl.signal,
      );
      if (!ctrl.signal.aborted) setDestinationResolvedPlace(n);
    })();
    return () => ctrl.abort();
  }, [mapboxAccessToken, effectiveDestinationCoords]);

  useEffect(() => {
    if (!mapboxAccessToken || originLabel.trim().length < 2) {
      setOriginSuggestions([]);
      setOriginCoords(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = mapboxForwardGeocodeUrl(
          originLabel.trim(),
          mapboxAccessToken,
        );
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return;
        const j = await res.json();
        const values = parseMapboxGeocodeFeatures(j);
        setOriginSuggestions(values);
        const exact = values.find(
          (v) => v.label.toLowerCase() === originLabel.trim().toLowerCase(),
        );
        setOriginCoords(exact ? { lng: exact.lng, lat: exact.lat } : null);
      } catch {}
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [originLabel, mapboxAccessToken]);

  useEffect(() => {
    if (!mapboxAccessToken || destinationLabel.trim().length < 2) {
      setDestinationSuggestions([]);
      setDestinationCoords(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = mapboxForwardGeocodeUrl(
          destinationLabel.trim(),
          mapboxAccessToken,
        );
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return;
        const j = await res.json();
        const values = parseMapboxGeocodeFeatures(j);
        setDestinationSuggestions(values);
        const exact = values.find(
          (v) =>
            v.label.toLowerCase() === destinationLabel.trim().toLowerCase(),
        );
        setDestinationCoords(exact ? { lng: exact.lng, lat: exact.lat } : null);
      } catch {}
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [destinationLabel, mapboxAccessToken]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const oLat = originLatManual.trim();
      const oLng = originLngManual.trim();
      if ((oLat !== "") !== (oLng !== "")) {
        throw new Error(
          "Origin: enter both latitude and longitude, or leave both empty.",
        );
      }
      if (oLat !== "" && !parseLatLngFromStrings(originLatManual, originLngManual)) {
        throw new Error(
          "Origin coordinates invalid: use latitude −90…90 and longitude −180…180.",
        );
      }
      const dLat = destinationLatManual.trim();
      const dLng = destinationLngManual.trim();
      if ((dLat !== "") !== (dLng !== "")) {
        throw new Error(
          "Destination: enter both latitude and longitude, or leave both empty.",
        );
      }
      if (
        dLat !== "" &&
        !parseLatLngFromStrings(destinationLatManual, destinationLngManual)
      ) {
        throw new Error(
          "Destination coordinates invalid: use latitude −90…90 and longitude −180…180.",
        );
      }

      const res = await fetch("/api/shipments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLabel,
          destinationLabel,
          originCoords: effectiveOriginCoords,
          destinationCoords: effectiveDestinationCoords,
          receiverEmail,
          senderEmail,
          estimatedDeliveryAt: estimatedDeliveryAt
            ? new Date(estimatedDeliveryAt).toISOString()
            : null,
          weightKg: Number(weightKg),
          customerName: customerName.trim() || null,
          serviceLevel: serviceLevel.trim() || null,
          internalNotes: internalNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/beth/login?from=/beth/ship");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const tn = encodeURIComponent(data.trackingNumber);
      const queueHint = data.notificationScheduleError ? `?notifyQueue=1` : "";
      router.push(`/beth/shipments/${tn}${queueHint}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New shipment</h1>
        <p className="mt-3 text-base text-gray-600">
          Enter origin and destination labels. For accurate routing and maps,
          add coordinates: pick a Mapbox suggestion, or optionally paste
          latitude and longitude (WGS‑84). The API also accepts{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
            originLat
          </code>
          /
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
            originLng
          </code>{" "}
          (and destination equivalents) on{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
            POST /api/shipments
          </code>
          .
        </p>
        {!mapboxAccessToken && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Without a Mapbox token you can still create shipments using optional
            lat/lng fields below. Set{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs shadow-sm">
              NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
            </code>{" "}
            for address search and map preview (same token as the tracking map).
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">Origin</span>
          <input
            value={originLabel}
            onChange={(e) => {
              const v = e.target.value;
              setOriginLabel(v);
              const exact = originSuggestions.find((s) => s.label === v);
              setOriginCoords(exact ? { lng: exact.lng, lat: exact.lat } : null);
            }}
            list="origin-suggestions"
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="Any city, country (e.g., Nairobi, Kenya)"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">
                Latitude (optional)
              </span>
              <input
                value={originLatManual}
                onChange={(e) => setOriginLatManual(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                placeholder="e.g. 5.6037"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">
                Longitude (optional)
              </span>
              <input
                value={originLngManual}
                onChange={(e) => setOriginLngManual(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                placeholder="e.g. -0.187"
              />
            </label>
          </div>
          {effectiveOriginCoords && originResolvedPlace && (
            <p className="text-xs text-gray-600">
              Coordinates resolve to:{" "}
              <span className="text-gray-800">
                {originResolvedPlace}
              </span>
            </p>
          )}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">Destination</span>
          <input
            value={destinationLabel}
            onChange={(e) => {
              const v = e.target.value;
              setDestinationLabel(v);
              const exact = destinationSuggestions.find((s) => s.label === v);
              setDestinationCoords(
                exact ? { lng: exact.lng, lat: exact.lat } : null,
              );
            }}
            list="destination-suggestions"
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="Any city, country (e.g., Quito, Ecuador)"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">
                Latitude (optional)
              </span>
              <input
                value={destinationLatManual}
                onChange={(e) => setDestinationLatManual(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                placeholder="e.g. -12.0464"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">
                Longitude (optional)
              </span>
              <input
                value={destinationLngManual}
                onChange={(e) => setDestinationLngManual(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                placeholder="e.g. -77.0428"
              />
            </label>
          </div>
          {effectiveDestinationCoords && destinationResolvedPlace && (
            <p className="text-xs text-gray-600">
              Coordinates resolve to:{" "}
              <span className="text-gray-800">
                {destinationResolvedPlace}
              </span>
            </p>
          )}
        </label>

        <datalist id="origin-suggestions">
          {[
            ...new Set([
              ...originSuggestions.map((s) => s.label),
              ...POPULAR_LOCATIONS,
            ]),
          ].map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <datalist id="destination-suggestions">
          {[
            ...new Set([
              ...destinationSuggestions.map((s) => s.label),
              ...POPULAR_LOCATIONS,
            ]),
          ].map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <label className="block space-y-1.5">
          <span className="text-sm text-gray-600">Customer name</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="Optional"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-gray-600">Service level</span>
          <input
            value={serviceLevel}
            onChange={(e) => setServiceLevel(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="Standard, Express, …"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-gray-600">Sender email</span>
          <input
            type="email"
            required
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="sender@example.com"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-gray-600">Receiver email</span>
          <input
            type="email"
            required
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="customer@example.com"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-gray-600">Weight (kg)</span>
          <input
            type="number"
            step="0.1"
            min="0.1"
            required
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-gray-600">
            Estimated delivery (optional)
          </span>
          <input
            type="datetime-local"
            value={estimatedDeliveryAt}
            onChange={(e) => setEstimatedDeliveryAt(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-gray-600">
            Internal notes (admin only)
          </span>
          <textarea
            rows={2}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="Optional"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create shipment"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        <Link
          href="/beth/shipments"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          View all shipments
        </Link>
      </p>
    </div>
  );
}
