import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";

export function getAdminSessionCookieName(): string {
  return COOKIE_NAME;
}

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set to at least 32 characters",
    );
  }
  return new TextEncoder().encode(s);
}

export async function signAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    const s = process.env.ADMIN_SESSION_SECRET;
    if (!s || s.length < 32) return false;
    await jwtVerify(token, new TextEncoder().encode(s));
    return true;
  } catch {
    return false;
  }
}
