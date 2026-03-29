"use client";

import Link from "next/link";
import { useState } from "react";

export default function BethEmailSettingsPage() {
  const [manualTo, setManualTo] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualMsg, setManualMsg] = useState<string | null>(null);
  const [manualErr, setManualErr] = useState<string | null>(null);

  async function onSendManual(e: React.FormEvent) {
    e.preventDefault();
    setManualBusy(true);
    setManualErr(null);
    setManualMsg(null);
    try {
      const res = await fetch("/api/beth/smtp/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: manualTo,
          subject: manualSubject,
          message: manualMessage,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Send failed");
      setManualMsg("Email sent.");
      setManualSubject("");
      setManualMessage("");
    } catch (e) {
      setManualErr(e instanceof Error ? e.message : "Error");
    } finally {
      setManualBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email (SMTP)</h1>
        <p className="mt-3 text-base text-gray-600">
          SMTP settings are managed from environment variables in{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm">
            .env
          </code>
          . This page is for sending manual operational emails only.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
        <h2 className="text-xl font-bold text-gray-900">Send manual email</h2>
        <p className="text-sm text-gray-600">
          Use this when an operational delay needs a manual customer update.
        </p>
        <form onSubmit={onSendManual} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">
              To (comma-separated emails)
            </span>
            <input
              required
              value={manualTo}
              onChange={(e) => setManualTo(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
              placeholder="sender@example.com, receiver@example.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Subject</span>
            <input
              required
              value={manualSubject}
              onChange={(e) => setManualSubject(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Message</span>
            <textarea
              required
              rows={5}
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
          {manualMsg && (
            <p className="text-sm font-medium text-emerald-600">{manualMsg}</p>
          )}
          {manualErr && (
            <p className="text-sm text-red-600">{manualErr}</p>
          )}
          <button
            type="submit"
            disabled={manualBusy}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {manualBusy ? "Sending…" : "Send manual email"}
          </button>
        </form>
      </section>

      <p className="text-center text-sm text-gray-600">
        <Link
          href="/beth"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
