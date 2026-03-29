"use client";

import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_PRESETS = [
  "in_transit",
  "delivered",
  "delayed",
  "cancelled",
  "exception",
] as const;

type Detail = {
  shipment: {
    id: string;
    trackingNumber: string;
    referenceCode: string | null;
    status: string;
    originLabel: string;
    destinationLabel: string;
    receiverEmail: string;
    senderEmail: string | null;
    customerName: string | null;
    serviceLevel: string | null;
    internalNotes: string | null;
    weightKg: number;
    createdAt: string;
    estimatedDeliveryAt: string;
  };
  events: {
    id: string;
    label: string;
    occurredAt: string;
    notifyEmail: boolean;
    source: string;
  }[];
};

export default function BethShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackingNumber = decodeURIComponent(
    String(params.trackingNumber ?? ""),
  );
  const notifyQueueHint = searchParams.get("notifyQueue") === "1";

  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [serviceLevel, setServiceLevel] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [status, setStatus] = useState("");
  const [eta, setEta] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [stopLabel, setStopLabel] = useState("");
  const [stopAt, setStopAt] = useState("");
  const [stopNotify, setStopNotify] = useState(true);
  const [stopBusy, setStopBusy] = useState(false);
  const [approvingEventId, setApprovingEventId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

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

  async function load() {
    const res = await fetch(
      `/api/beth/shipments/${encodeURIComponent(trackingNumber)}`,
      { credentials: "include" },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Failed");
    setData(j);
    const s = j.shipment;
    setCustomerName(s.customerName ?? "");
    setServiceLevel(s.serviceLevel ?? "");
    setInternalNotes(s.internalNotes ?? "");
    setReceiverEmail(s.receiverEmail);
    setSenderEmail(s.senderEmail ?? "");
    setWeightKg(String(s.weightKg));
    setStatus(s.status);
    setEta(s.estimatedDeliveryAt.slice(0, 16));
  }

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      c = true;
    };
  }, [trackingNumber]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  async function saveShipment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/beth/shipments/${encodeURIComponent(trackingNumber)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            serviceLevel,
            internalNotes,
            receiverEmail,
            senderEmail: senderEmail.trim() || null,
            weightKg: Number(weightKg),
            status,
            estimatedDeliveryAt: new Date(eta).toISOString(),
          }),
        },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteShipment() {
    if (
      !window.confirm(
        "Delete this shipment permanently? This cannot be undone.",
      )
    ) {
      return;
    }
    setDeleting(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/beth/shipments/${encodeURIComponent(trackingNumber)}`,
        { method: "DELETE", credentials: "include" },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Delete failed");
      router.push("/beth/shipments");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(false);
    }
  }

  async function addStop(e: React.FormEvent) {
    e.preventDefault();
    setStopBusy(true);
    setErr(null);
    try {
      const iso = stopAt
        ? new Date(stopAt).toISOString()
        : new Date().toISOString();
      const res = await fetch(
        `/api/beth/shipments/${encodeURIComponent(trackingNumber)}/stops`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: stopLabel,
            occurredAt: iso,
            notifyEmail: stopNotify,
          }),
        },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setStopLabel("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setStopBusy(false);
    }
  }

  async function approveEvent(eventId: string) {
    setApprovingEventId(eventId);
    setErr(null);
    try {
      const res = await fetch(
        `/api/beth/shipments/${encodeURIComponent(
          trackingNumber,
        )}/events/${encodeURIComponent(eventId)}/approve`,
        { method: "POST", credentials: "include" },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Approve failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setApprovingEventId(null);
    }
  }

  if (err && !data) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{err}</p>
        <Link
          href="/beth/shipments"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Back to list
        </Link>
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-600">Loading…</p>;
  }

  const s = data.shipment;
  const nextPendingEventId = data.events.find((ev) => ev.source !== "admin")?.id;

  function dismissQueueHint() {
    router.replace(`/beth/shipments/${encodeURIComponent(trackingNumber)}`);
  }

  return (
    <div className="space-y-10">
      {notifyQueueHint && (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p>
            <strong className="font-semibold text-amber-900">
              Emails were not scheduled.
            </strong>{" "}
            This app sends mail from a separate{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs shadow-sm">
              npm run worker
            </code>{" "}
            process using Redis. Start Redis, set{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs shadow-sm">
              REDIS_URL
            </code>{" "}
            in <code className="font-mono text-xs">.env</code>, run the worker,
            then add a stop with &quot;notify&quot; or create a new shipment.
          </p>
          <button
            type="button"
            onClick={dismissQueueHint}
            className="shrink-0 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-900 shadow-sm hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Shipment
          </p>
          <h1 className="mt-1 font-mono text-3xl font-bold tracking-tight text-gray-900">
            {s.trackingNumber}
          </h1>
          {s.referenceCode && (
            <p className="mt-2 inline-block rounded-md border border-gray-200 bg-white px-3 py-1 font-mono text-sm text-gray-600">
              Reference {s.referenceCode}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/track/${encodeURIComponent(s.trackingNumber)}`}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            Public view
          </Link>
          <button
            type="button"
            onClick={deleteShipment}
            disabled={deleting}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete shipment"}
          </button>
          <AdminLogoutButton />
        </div>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
        <h2 className="text-xl font-bold text-gray-900">Overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-gray-600">Route</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {s.originLabel} → {s.destinationLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-600">Service</dt>
            <dd className="mt-1 text-sm text-gray-900">{s.serviceLevel ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-600">Weight</dt>
            <dd className="mt-1 text-sm text-gray-900">{s.weightKg} kg</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-600">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatPartyTime(s.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-600">ETA</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatPartyTime(s.estimatedDeliveryAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-600">Status</dt>
            <dd className="mt-1 text-sm capitalize text-gray-900">{s.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-600">Sender email</dt>
            <dd className="mt-1 break-all text-sm text-gray-900">
              {s.senderEmail ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-600">Receiver email</dt>
            <dd className="mt-1 break-all text-sm text-gray-900">
              {s.receiverEmail}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
        <h2 className="text-xl font-bold text-gray-900">Edit details</h2>
        <form onSubmit={saveShipment} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm text-gray-600">Customer name</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-600">Service level</span>
            <input
              value={serviceLevel}
              onChange={(e) => setServiceLevel(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-600">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm capitalize outline-none focus:ring-2 focus:ring-blue-600"
            >
              {[
                ...new Set(
                  STATUS_PRESETS.includes(
                    status as (typeof STATUS_PRESETS)[number],
                  )
                    ? STATUS_PRESETS
                    : [status, ...STATUS_PRESETS],
                ),
              ].map((v) => (
                <option key={v} value={v}>
                  {v.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-600">Sender email</span>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Optional — notifications also go here"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-600">Receiver email</span>
            <input
              type="email"
              required
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-600">Weight (kg)</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm text-gray-600">ETA (local)</span>
            <input
              type="datetime-local"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm text-gray-600">
              Internal notes (not shown on public tracking)
            </span>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
          {err && (
            <p className="text-sm text-red-600 sm:col-span-2" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50 sm:col-span-2"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
        <h2 className="text-xl font-bold text-gray-900">Timeline & stops</h2>
        <p className="mt-2 text-sm text-gray-600">
          Add checkpoints or updates. Optionally email the sender and receiver
          when the stop is recorded.
        </p>
        <ul className="mt-4 space-y-3 border-l border-gray-200 pl-4">
          {data.events.map((ev) => (
            <li key={ev.id} className="relative">
              <span
                className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${
                  ev.source === "admin" ? "bg-green-500" : "bg-amber-400"
                }`}
              />
              <p className="text-sm font-medium">{ev.label}</p>
              <p className="text-xs text-gray-600">
                {formatPartyTime(ev.occurredAt)}
                {ev.source === "admin" && (
                  <span className="ml-2 rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                    Confirmed
                  </span>
                )}
                {ev.notifyEmail && (
                  <span className="ml-2 text-gray-600">· Email</span>
                )}
              </p>
              {ev.source !== "admin" && (
                <button
                  type="button"
                  onClick={() => approveEvent(ev.id)}
                  disabled={
                    approvingEventId === ev.id || ev.id !== nextPendingEventId
                  }
                  className="mt-1 rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  {approvingEventId === ev.id
                    ? "Approving..."
                    : ev.id === nextPendingEventId
                      ? "Approve point"
                      : "Waiting previous approval"}
                </button>
              )}
            </li>
          ))}
        </ul>

        <form
          onSubmit={addStop}
          className="mt-6 space-y-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4"
        >
          <h3 className="text-sm font-bold text-gray-900">Add stop</h3>
          <input
            placeholder="Stop description (e.g. Arrived at customs)"
            value={stopLabel}
            onChange={(e) => setStopLabel(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <input
            type="datetime-local"
            value={stopAt}
            onChange={(e) => setStopAt(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={stopNotify}
              onChange={(e) => setStopNotify(e.target.checked)}
              className="rounded border-gray-200"
            />
            Send notification email to sender and receiver
          </label>
          <button
            type="submit"
            disabled={stopBusy}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50"
          >
            {stopBusy ? "Adding…" : "Add stop"}
          </button>
        </form>
      </section>

      <p>
        <Link
          href="/beth/shipments"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          ← All shipments
        </Link>
      </p>
    </div>
  );
}
