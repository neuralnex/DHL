"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      const from = searchParams.get("from");
      router.push(from && from.startsWith("/beth") ? from : "/beth");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Staff sign in</h1>
        <p className="mt-3 text-base text-gray-600">
          Use the credentials configured in your environment.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:p-8"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
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
          className="w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600">
        <Link
          href="/track"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Track a shipment
        </Link>
        {" · "}
        <Link href="/" className="font-medium hover:text-blue-700 hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}

export default function BethLoginPage() {
  return (
    <Suspense fallback={<p className="text-gray-600">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
