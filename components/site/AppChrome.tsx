"use client";

import { usePathname } from "next/navigation";
import { MarketingHeader } from "./MarketingHeader";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <MarketingHeader />
      <main
        className={
          isHome
            ? "w-full max-w-none px-0 py-0"
            : "mx-auto w-full max-w-7xl px-4 py-10 pb-16 text-gray-800 md:px-8"
        }
      >
        {children}
      </main>
    </>
  );
}
