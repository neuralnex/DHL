"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackLookupPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = value.trim();
    if (!id) {
      setError("Enter a tracking number");
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Track a shipment</h1>
        <p className="mt-3 text-base text-gray-600">
          Shipments are created by WestridgeLogistics staff. Enter the tracking
          number you were given to see status and map.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Tracking number
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-base text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="e.g. WRL847291056384"
            autoComplete="off"
          />
        </label>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-blue-700"
        >
          Track
        </button>
      </form>
      <p className="text-center text-sm text-gray-600">
        <Link href="/" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
