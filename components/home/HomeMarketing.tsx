"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function HomeMarketing() {
  const router = useRouter();
  const [trackInput, setTrackInput] = useState("");
  const scrollTopRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opts = { root: null, rootMargin: "0px", threshold: 0.1 };
    const observer = new IntersectionObserver((entries, ob) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          ob.unobserve(entry.target);
        }
      });
    }, opts);
    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const btn = scrollTopRef.current;
    function onScroll() {
      if (!btn) return;
      if (window.scrollY > 500) {
        btn.classList.remove("translate-y-20", "opacity-0");
      } else {
        btn.classList.add("translate-y-20", "opacity-0");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onTrack(e: React.FormEvent) {
    e.preventDefault();
    const id = trackInput.trim();
    if (!id) return;
    router.push(`/track/${encodeURIComponent(id)}`);
  }

  return (
    <div className="bg-white text-gray-800">
      <header className="relative flex h-[600px] w-full items-center justify-center overflow-hidden hero-bg">
        <div className="absolute inset-0 bg-blue-900/30" />

        <div className="relative z-10 w-full max-w-5xl px-4 text-center">
          <h1 className="fade-in-up mb-8 text-4xl font-bold text-white drop-shadow-lg">
            Track Your Shipment
          </h1>

          <form
            onSubmit={onTrack}
            className="fade-in-up mx-auto flex max-w-4xl flex-col items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl md:flex-row"
            style={{ transitionDelay: "100ms" }}
          >
            <input
              type="text"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder="Enter your tracking number(s)"
              className="w-full bg-transparent p-4 text-lg text-gray-700 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="w-full whitespace-nowrap rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:bg-blue-700 md:w-auto"
            >
              Track
            </button>
          </form>
        </div>

        <div className="absolute bottom-[-6rem] left-0 right-0 z-20 w-full px-4 md:bottom-[-4rem]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href="/track"
              className="fade-in-up hover-card cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
              style={{ transitionDelay: "200ms" }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-2xl text-blue-700">
                  <i className="fa-solid fa-box" aria-hidden />
                </div>
                <h3 className="mb-1 text-lg font-bold">Track your package</h3>
                <p className="text-sm text-gray-500">
                  Use the tracking number we sent you
                </p>
              </div>
            </Link>

            <Link
              href="/track"
              className="fade-in-up hover-card cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
              style={{ transitionDelay: "300ms" }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-2xl text-blue-700">
                  <i className="fa-solid fa-route" aria-hidden />
                </div>
                <h3 className="mb-1 text-lg font-bold">Live journey updates</h3>
                <p className="text-sm text-gray-500">
                  Status timeline and map on the track page
                </p>
              </div>
            </Link>

            <a
              href="mailto:westridgelogistics01@gmail.com?subject=Customer%20service%20inquiry"
              className="fade-in-up hover-card relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
              style={{ transitionDelay: "400ms" }}
            >
              <div className="absolute right-0 top-0 -mr-8 -mt-8 h-16 w-16 rounded-full bg-blue-100" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-2xl text-blue-700">
                  <i className="fa-regular fa-circle-question" aria-hidden />
                </div>
                <h3 className="mb-1 text-lg font-bold">Need help?</h3>
                <p className="text-sm text-gray-500">
                  Service updates and customer support information
                </p>
              </div>
            </a>
          </div>
        </div>
      </header>

      <div className="h-32 bg-white md:h-24" />

      <section id="quote" className="fade-in-up bg-blue-100 px-4 py-12 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 md:flex-row">
          <div className="w-full md:w-1/3">
            <img
              src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop"
              alt=""
              className="h-64 w-full rounded-xl object-cover shadow-lg"
            />
          </div>
          <div className="w-full md:w-2/3">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Navigating Latest Tariff Developments
            </h2>
            <p className="mb-6 leading-relaxed text-gray-800">
              Global trade is becoming increasingly complex as new U.S. tariffs
              and varying reciprocal measures emerge across countries and
              industries. At WestridgeLogistics, we are committed to helping you
              navigate these changes.
            </p>
            <Link
              href="/track"
              className="inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              Track a shipment
            </Link>
          </div>
        </div>
      </section>

      <section id="express" className="fade-in-up mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm md:flex-row">
          <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
            <h2 className="mb-2 text-3xl font-bold">Document and Parcel Shipping</h2>
            <h3 className="mb-6 text-xl font-light text-gray-600">
              For your deliveries
            </h3>
            <p className="mb-8 text-lg text-gray-600">
              When we ship your document or parcel, you can follow it end to end
              with your tracking number — no account required.
            </p>

            <div className="mb-8 rounded-xl bg-gray-200/50 p-6">
              <h4 className="mb-4 font-bold text-gray-800">Services Available</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-plane" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">
                    Next Possible Business Day
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-briefcase" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">
                    Tailored Business Solutions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-boxes-packing" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">
                    Flexible Import/Export Options
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-hand-holding-box" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">
                    Wide Variety of Optional Services
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/track"
              className="block w-full rounded-xl bg-blue-600 py-3 text-center font-bold text-white transition-colors hover:bg-blue-700"
            >
              Track a shipment
            </Link>
          </div>
          <div className="relative h-64 w-full md:h-auto md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=1000&auto=format&fit=crop"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="cargo" className="fade-in-up mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm md:flex-row-reverse">
          <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
            <h2 className="mb-2 text-3xl font-bold">Cargo Shipping</h2>
            <h3 className="mb-6 text-xl font-light text-gray-600">
              Business Only
            </h3>
            <p className="mb-8 text-lg text-gray-600">
              Freight moves are arranged by our team. If you have a consignment
              with us, track it the same way with your reference number.
            </p>

            <div className="mb-8 rounded-xl bg-gray-200/50 p-6">
              <h4 className="mb-4 font-bold text-gray-800">Services Available</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-plane-departure" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">Air Freight</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-ship" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">Ocean Freight</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-truck" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">Road Freight</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-300 text-xs">
                    <i className="fa-solid fa-train" aria-hidden />
                  </div>
                  <span className="text-sm font-medium">Rail Freight</span>
                </div>
              </div>
            </div>

            <Link
              href="/track"
              className="block w-full rounded-xl bg-blue-600 py-3 text-center font-bold text-white transition-colors hover:bg-blue-700"
            >
              Track a shipment
            </Link>
          </div>
          <div className="relative h-64 w-full md:h-auto md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1000&auto=format&fit=crop"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section
        id="customer-service"
        className="fade-in-up mx-auto max-w-7xl px-4 py-16 md:px-8"
      >
        <h2 className="mb-2 text-3xl font-bold">Important Service Updates</h2>
        <p className="mb-8 text-lg text-gray-600">
          Service bulletins keep you up to date with news and alerts
        </p>

        <ul className="list-inside list-disc space-y-2 font-medium text-gray-800">
          <li>
            <a
              href="#"
              className="inline-flex items-center gap-2 hover:text-blue-700 hover:underline"
            >
              Operational Update Middle East{" "}
              <i className="fa-solid fa-chevron-right text-xs" aria-hidden />
            </a>
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="group cursor-pointer">
            <div className="h-64 overflow-hidden rounded-t-2xl bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"
                alt="Logistics warehouse and sustainable supply chain operations"
                width={800}
                height={400}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white p-6 shadow-sm transition-shadow group-hover:shadow-md">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
                Sustainability{" "}
                <i className="fa-solid fa-chevron-right text-xs text-blue-700" aria-hidden />
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Sustainable operations begin with lower-impact supply chains.
                Learn how we work to reduce environmental impact across the
                network.
              </p>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="h-64 overflow-hidden rounded-t-2xl bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800"
                alt="Global freight and connectivity across the logistics network"
                width={800}
                height={400}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white p-6 shadow-sm transition-shadow group-hover:shadow-md">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
                Global connectivity insights{" "}
                <i
                  className="fa-solid fa-arrow-up-right-from-square text-xs text-blue-700"
                  aria-hidden
                />
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                The global connectedness landscape continues to evolve. Westridge
                tracks trends that matter for shippers worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer
        id="portal-logins"
        className="border-t border-gray-200 bg-gray-100 pb-8 pt-12"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h4 className="mb-4 font-bold text-blue-700">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="mailto:westridgelogistics01@gmail.com?subject=Customer%20service%20inquiry"
                    className="hover:underline"
                  >
                    Customer Service
                  </a>
                </li>
                <li>
                  <Link href="/beth/login" className="hover:underline">
                    Staff sign in
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="hover:underline">
                    Track a shipment
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-gray-900">Our Services</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#express" className="hover:underline">
                    Express parcels
                  </a>
                </li>
                <li>
                  <a href="#cargo" className="hover:underline">
                    Freight forwarding
                  </a>
                </li>
                <li>
                  <Link href="/" className="hover:underline">
                    Overview
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-gray-900">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <span className="hover:underline">About WestridgeLogistics</span>
                </li>
                <li>
                  <span className="flex cursor-default items-center gap-1">
                    Careers{" "}
                    <i
                      className="fa-solid fa-arrow-up-right-from-square text-xs"
                      aria-hidden
                    />
                  </span>
                </li>
                <li>
                  <span className="hover:underline">Press</span>
                </li>
                <li>
                  <span className="flex cursor-default items-center gap-1">
                    Investors{" "}
                    <i
                      className="fa-solid fa-arrow-up-right-from-square text-xs"
                      aria-hidden
                    />
                  </span>
                </li>
                <li>
                  <span className="hover:underline">Sustainability</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-300 pt-8 md:flex-row">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <span className="text-2xl font-black italic tracking-tighter text-gray-900">
                Westridge
                <span className="ml-1 rounded border-2 border-black px-1 text-xs font-bold not-italic">
                  Group
                </span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 md:justify-end">
              <a href="#" className="hover:underline">
                Fraud Awareness
              </a>
              <a href="#" className="hover:underline">
                Legal Notice
              </a>
              <a href="#" className="hover:underline">
                Terms of Use
              </a>
              <a href="#" className="hover:underline">
                Privacy Notice
              </a>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} WestridgeLogistics — all rights reserved
          </div>
        </div>
      </footer>

      <button
        ref={scrollTopRef}
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 z-50 flex h-12 w-12 translate-y-20 items-center justify-center rounded-xl bg-blue-600 text-white opacity-0 shadow-lg transition-all duration-300 hover:bg-blue-700"
        aria-label="Scroll to top"
      >
        <i className="fa-solid fa-chevron-up" aria-hidden />
      </button>
    </div>
  );
}
