"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className={`sticky top-0 z-50 flex w-full items-center justify-between bg-white px-4 shadow-sm transition-all duration-300 md:px-8 ${
        scrolled ? "py-2 shadow-md" : "py-4"
      }`}
    >
      <div className="flex items-center gap-8">
        <Link
          href="/"
          className="flex items-center text-3xl font-black italic tracking-tighter text-blue-700"
        >
          Westridge
          <span className="ml-1 rounded border-2 border-blue-700 px-1 text-xs font-bold not-italic text-blue-700">
            LOGISTICS
          </span>
        </Link>
        <div className="hidden gap-8 font-medium text-gray-700 lg:flex">
          <Link href="/" className="transition-colors hover:text-blue-700">
            Home
          </Link>
          <Link href="/track" className="transition-colors hover:text-blue-700">
            Track
          </Link>
          <a
            href="mailto:westridgelogistics01@gmail.com?subject=Customer%20service%20inquiry"
            className="transition-colors hover:text-blue-700"
          >
            Customer Service
          </a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-2xl text-gray-800 lg:hidden"
          aria-label="Menu"
        >
          <i className="fa-solid fa-bars" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
