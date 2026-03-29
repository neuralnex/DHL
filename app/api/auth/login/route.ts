import {
  getAdminSessionCookieName,
  signAdminSessionToken,
} from "@/lib/auth/admin-jwt";
import { verifyAdminCredentials } from "@/lib/auth/admin-credentials";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let token: string;
    try {
      token = await signAdminSessionToken();
    } catch {
      return NextResponse.json(
        { error: "Server misconfiguration (session secret)" },
        { status: 500 },
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(getAdminSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
