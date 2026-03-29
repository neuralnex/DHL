import { getDataSource } from "@/lib/db/data-source";
import { Shipment } from "@/lib/db/entities";
import { addShipmentStop } from "@/lib/services/shipment-stops";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ trackingNumber: string }> },
) {
  try {
    const { trackingNumber } = await ctx.params;
    const body = await req.json();
    const label = String(body.label ?? "").trim();
    const occurredAtRaw = body.occurredAt;
    const notifyEmail = Boolean(body.notifyEmail);

    if (!label) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    const occurredAt = new Date(
      typeof occurredAtRaw === "string" ? occurredAtRaw : Date.now(),
    );
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Invalid occurredAt" }, { status: 400 });
    }

    const ds = await getDataSource();
    const ship = await ds.getRepository(Shipment).findOne({
      where: { trackingNumber },
    });
    if (!ship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ev = await addShipmentStop({
      shipmentId: ship.id,
      label,
      occurredAt,
      notifyEmail,
    });

    return NextResponse.json({
      id: ev.id,
      label: ev.label,
      occurredAt: ev.occurredAt.toISOString(),
      notifyEmail: ev.notifyEmail,
      source: ev.source,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
