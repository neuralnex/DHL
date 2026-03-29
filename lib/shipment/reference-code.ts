import { randomBytes } from "node:crypto";

export function generateReferenceCode(): string {
  const y = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `REF-${y}-${suffix}`;
}
