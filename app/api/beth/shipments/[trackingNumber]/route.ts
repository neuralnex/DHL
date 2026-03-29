import { getDataSource } from "@/lib/db/data-source";
import { RouteSegment, Shipment, TrackingEvent } from "@/lib/db/entities";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ trackingNumber: string }> },
) {
  try {
    const { trackingNumber } = await ctx.params;
    const ds = await getDataSource();
    const ship = await ds.getRepository(Shipment).findOne({
      where: { trackingNumber },
    });
    if (!ship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const segments = await ds.getRepository(RouteSegment).find({
      where: { shipmentId: ship.id },
      order: { sequence: "ASC" },
    });
    const events = await ds.getRepository(TrackingEvent).find({
      where: { shipmentId: ship.id },
      order: { sortOrder: "ASC" },
    });

    return NextResponse.json({
      shipment: {
        id: ship.id,
        trackingNumber: ship.trackingNumber,
        referenceCode: ship.referenceCode,
        status: ship.status,
        originLabel: ship.originLabel,
        destinationLabel: ship.destinationLabel,
        receiverEmail: ship.receiverEmail,
        senderEmail: ship.senderEmail,
        customerName: ship.customerName,
        serviceLevel: ship.serviceLevel,
        internalNotes: ship.internalNotes,
        weightKg: ship.weightKg,
        createdAt: ship.createdAt.toISOString(),
        estimatedDeliveryAt: ship.estimatedDeliveryAt.toISOString(),
        metadata: ship.metadata,
      },
      segments: segments.map((s) => ({
        id: s.id,
        sequence: s.sequence,
        mode: s.mode,
        fromLabel: s.fromLabel,
        toLabel: s.toLabel,
        path: s.path,
        distanceKm: s.distanceKm,
        durationMinutes: s.durationMinutes,
      })),
      events: events.map((e) => ({
        id: e.id,
        segmentSequence: e.segmentSequence,
        code: e.code,
        label: e.label,
        occurredAt: e.occurredAt.toISOString(),
        notifyEmail: e.notifyEmail,
        source: e.source,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ trackingNumber: string }> },
) {
  try {
    const { trackingNumber } = await ctx.params;
    const body = await req.json();
    const ds = await getDataSource();
    const repo = ds.getRepository(Shipment);
    const ship = await repo.findOne({ where: { trackingNumber } });
    if (!ship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.customerName !== undefined) {
      ship.customerName = String(body.customerName).trim() || null;
    }
    if (body.serviceLevel !== undefined) {
      ship.serviceLevel = String(body.serviceLevel).trim() || null;
    }
    if (body.internalNotes !== undefined) {
      ship.internalNotes = String(body.internalNotes).trim() || null;
    }
    if (body.status !== undefined) {
      ship.status = String(body.status).trim().slice(0, 32);
    }
    if (body.receiverEmail !== undefined) {
      const em = String(body.receiverEmail).trim();
      if (em.includes("@")) ship.receiverEmail = em;
    }
    if (body.senderEmail !== undefined) {
      const em = String(body.senderEmail).trim();
      ship.senderEmail = em.includes("@") ? em : null;
    }
    if (body.weightKg !== undefined) {
      const w = Number(body.weightKg);
      if (Number.isFinite(w) && w > 0) ship.weightKg = w;
    }
    if (body.originLabel !== undefined) {
      ship.originLabel = String(body.originLabel).trim();
    }
    if (body.destinationLabel !== undefined) {
      ship.destinationLabel = String(body.destinationLabel).trim();
    }
    if (body.estimatedDeliveryAt !== undefined) {
      const d = new Date(String(body.estimatedDeliveryAt));
      if (!Number.isNaN(d.getTime())) ship.estimatedDeliveryAt = d;
    }

    await repo.save(ship);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ trackingNumber: string }> },
) {
  try {
    const { trackingNumber } = await ctx.params;
    const ds = await getDataSource();
    const repo = ds.getRepository(Shipment);
    const ship = await repo.findOne({ where: { trackingNumber } });
    if (!ship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await repo.remove(ship);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
