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

    const meta = ship.metadata as
      | {
          originCoords?: { lng: number; lat: number } | null;
          destinationCoords?: { lng: number; lat: number } | null;
        }
      | null
      | undefined;

    return NextResponse.json({
      shipment: {
        id: ship.id,
        trackingNumber: ship.trackingNumber,
        referenceCode: ship.referenceCode,
        status: ship.status,
        originLabel: ship.originLabel,
        destinationLabel: ship.destinationLabel,
        originCoords: meta?.originCoords ?? null,
        destinationCoords: meta?.destinationCoords ?? null,
        customerName: ship.customerName,
        serviceLevel: ship.serviceLevel,
        weightKg: ship.weightKg,
        createdAt: ship.createdAt.toISOString(),
        estimatedDeliveryAt: ship.estimatedDeliveryAt.toISOString(),
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
        confirmed: e.source === "admin",
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
