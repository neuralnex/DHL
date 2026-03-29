import { getAdminSessionCookieName } from "@/lib/auth/admin-jwt";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE = getAdminSessionCookieName();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiBeth = pathname.startsWith("/api/beth");
  const isPageBeth = pathname.startsWith("/beth");

  if (!isPageBeth && !isApiBeth) {
    return NextResponse.next();
  }

  if (pathname === "/beth/login") {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (isApiBeth) {
      return NextResponse.json(
        { error: "Admin auth is not configured" },
        { status: 503 },
      );
    }
    return new NextResponse(
      "Admin auth is not configured. Set ADMIN_SESSION_SECRET (32+ characters).",
      { status: 503 },
    );
  }

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    if (isApiBeth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/beth/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    if (isApiBeth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/beth/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/beth", "/beth/:path*", "/api/beth/:path*"],
};
