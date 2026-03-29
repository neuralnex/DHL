"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  trackingNumber: string;
  referenceCode: string | null;
  status: string;
  originLabel: string;
  destinationLabel: string;
  customerName: string | null;
  serviceLevel: string | null;
  weightKg: number;
  createdAt: string;
  estimatedDeliveryAt: string;
};

export default function BethShipmentsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const res = await fetch("/api/beth/shipments", { credentials: "include" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Failed");
        if (!c) setRows(j.shipments);
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  if (err) {
    return <p className="text-red-600">{err}</p>;
  }
  if (!rows) {
    return <p className="text-gray-600">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
          <p className="mt-2 text-base text-gray-600">
            Open a shipment to edit details, add stops, and trigger emails.
          </p>
        </div>
        <Link
          href="/beth/ship"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          New shipment
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
        <table className="w-full min-w-[720px] text-left text-sm text-gray-800">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Tracking</th>
              <th className="px-4 py-3 font-semibold">Route</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">ETA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-700">
                  {r.referenceCode ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/beth/shipments/${encodeURIComponent(r.trackingNumber)}`}
                    className="font-mono font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {r.trackingNumber}
                  </Link>
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-gray-600">
                  {r.originLabel} → {r.destinationLabel}
                </td>
                <td className="px-4 py-3">{r.customerName ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                  {new Date(r.estimatedDeliveryAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-600">
            No shipments yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
