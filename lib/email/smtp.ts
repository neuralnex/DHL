import nodemailer from "nodemailer";
import {
  invalidateSmtpCache as clearResolvedSmtpCache,
  resolveSmtpConfig,
} from "@/lib/services/smtp-config";

let cachedFingerprint: string | null = null;
let transporter: nodemailer.Transporter | null = null;

function fingerprint(cfg: NonNullable<Awaited<ReturnType<typeof resolveSmtpConfig>>>): string {
  return `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user}:${cfg.password}:${cfg.from}:${cfg.source}`;
}

export async function getSmtpTransport(): Promise<nodemailer.Transporter> {
  const cfg = await resolveSmtpConfig();
  if (!cfg) {
    throw new Error(
      "SMTP is not configured. Set it in Admin → Email settings or use SMTP_* env vars.",
    );
  }
  const fp = fingerprint(cfg);
  if (transporter && cachedFingerprint === fp) {
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    ...(cfg.user || cfg.password
      ? { auth: { user: cfg.user, pass: cfg.password } }
      : {}),
  });
  cachedFingerprint = fp;
  return transporter;
}

export function invalidateSmtpCache(): void {
  transporter = null;
  cachedFingerprint = null;
  clearResolvedSmtpCache();
}

function normalizeRecipients(
  to: string | string[],
): { header: string; addresses: string[] } {
  const raw = Array.isArray(to) ? to : [to];
  const seen = new Set<string>();
  const addresses: string[] = [];
  for (const e of raw) {
    const t = e.trim();
    if (!t.includes("@")) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    addresses.push(t);
  }
  if (addresses.length === 0) {
    throw new Error("No valid recipient addresses");
  }
  return { header: addresses.join(", "), addresses };
}

export async function sendShipmentNotificationEmail(params: {
  to: string | string[];
  trackingNumber: string;
  subjectLine: string;
  bodyText: string;
  /** Pre-built HTML; if omitted, a simple paragraph layout is generated from bodyText */
  bodyHtml?: string;
}): Promise<void> {
  const cfg = await resolveSmtpConfig();
  if (!cfg) {
    throw new Error("SMTP is not configured");
  }
  const { header: toHeader } = normalizeRecipients(params.to);
  const transport = await getSmtpTransport();
  const html =
    params.bodyHtml ??
    `<div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.5">
${params.bodyText
  .split("\n")
  .map((l) => (l ? `<p style="margin:0 0 .75em">${escapeHtml(l)}</p>` : "<br/>"))
  .join("\n")}
</div>`;
  await transport.sendMail({
    from: cfg.from,
    to: toHeader,
    subject: params.subjectLine,
    text: params.bodyText,
    html,
  });
}

export async function sendDirectEmail(params: {
  to: string | string[];
  subject: string;
  bodyText: string;
}): Promise<void> {
  const cfg = await resolveSmtpConfig();
  if (!cfg) {
    throw new Error("SMTP is not configured");
  }
  const { header: toHeader } = normalizeRecipients(params.to);
  const transport = await getSmtpTransport();
  await transport.sendMail({
    from: cfg.from,
    to: toHeader,
    subject: params.subject,
    text: params.bodyText,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.5">
${params.bodyText
  .split("\n")
  .map((l) => (l ? `<p style="margin:0 0 .75em">${escapeHtml(l)}</p>` : "<br/>"))
  .join("\n")}
</div>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
