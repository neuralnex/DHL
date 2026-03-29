import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import Link from "next/link";

export default function BethHomePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Staff dashboard</h1>
        <p className="mt-3 text-base text-gray-600">
          Only signed-in admins can create and manage shipments. Everyone else
          uses the public track page with their tracking number.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/beth/ship"
          className="hover-card rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition hover:border-blue-100"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-700">
            <i className="fa-solid fa-box" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Create shipment</h2>
          <p className="mt-1 text-sm text-gray-500">
            New booking with customer and route details
          </p>
        </Link>
        <Link
          href="/beth/shipments"
          className="hover-card rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition hover:border-blue-100"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-700">
            <i className="fa-solid fa-list" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-gray-900">All shipments</h2>
          <p className="mt-1 text-sm text-gray-500">
            Edit, add stops, send emails
          </p>
        </Link>
        <Link
          href="/beth/settings/email"
          className="hover-card rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition hover:border-blue-100 sm:col-span-2"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-700">
            <i className="fa-solid fa-envelope" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Email (SMTP)</h2>
          <p className="mt-1 text-sm text-gray-500">
            Send manual updates; SMTP from environment variables
          </p>
        </Link>
      </div>
      <AdminLogoutButton />
    </div>
  );
}
