import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALGO = "aes-256-gcm";

function key32(): Buffer {
  const secret =
    process.env.SETTINGS_ENCRYPTION_KEY ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY or ADMIN_SESSION_SECRET (32+ chars) required for encryption",
    );
  }
  return scryptSync(secret, "logistics-smtp-v1", 32);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, key32(), iv);
  const enc = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 16);
  const tag = buf.subarray(16, 32);
  const data = buf.subarray(32);
  const decipher = createDecipheriv(ALGO, key32(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}
