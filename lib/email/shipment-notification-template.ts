/**
 * Public site URL for track links in emails. Set in production on the app and worker
 * (e.g. Vercel: PUBLIC_APP_URL or NEXT_PUBLIC_APP_URL).
 */
export function resolvePublicAppBaseUrl(): string {
  const raw =
    process.env.PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  if (!raw.trim()) {
    throw new Error(
      "PUBLIC_APP_URL (or NEXT_PUBLIC_APP_URL) is not set. " +
        "Add it to .env so email track links point to the correct domain.",
    );
  }
  return raw.trim().replace(/\/+$/, "");
}

export function buildTrackShipmentUrl(trackingNumber: string): string {
  const base = resolvePublicAppBaseUrl();
  return `${base}/track/${encodeURIComponent(trackingNumber)}`;
}

/** e.g. 2026-03-29 22:36:52.822 */
export function formatTimestampUtc(d: Date): string {
  return d.toISOString().replace("T", " ").replace("Z", "");
}

export function buildShipmentNotificationContent(input: {
  trackingNumber: string;
  eventStatusLabel: string;
  originLabel: string;
  destinationLabel: string;
  occurredAt: Date;
}): { subject: string; text: string; html: string } {
  const trackUrl = buildTrackShipmentUrl(input.trackingNumber);
  const ts = formatTimestampUtc(input.occurredAt);
  const route = `${input.originLabel} → ${input.destinationLabel}`;

  const text = [
    `Shipment ID: ${input.trackingNumber}`,
    `Status: ${input.eventStatusLabel}`,
    ``,
    `Route: ${route}`,
    `Timestamp (UTC): ${ts}`,
    ``,
    `Track Shipment: ${trackUrl}`,
  ].join("\n");

  const subject = `WestridgeLogistics — ${input.eventStatusLabel} (${input.trackingNumber})`;

  const esc = escapeHtml;
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;line-height:1.55;color:#1f2937;font-size:15px">
<p style="margin:0 0 6px"><strong>Shipment ID:</strong> ${esc(input.trackingNumber)}</p>
<p style="margin:0 0 16px"><strong>Status:</strong> ${esc(input.eventStatusLabel)}</p>
<p style="margin:0 0 6px"><strong>Route:</strong> ${esc(route)}</p>
<p style="margin:0 0 20px"><strong>Timestamp (UTC):</strong> ${esc(ts)}</p>
<p style="margin:0"><strong>Track Shipment:</strong> <a href="${escAttr(trackUrl)}" style="color:#2563eb;font-weight:600">${esc(trackUrl)}</a></p>
</div>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
