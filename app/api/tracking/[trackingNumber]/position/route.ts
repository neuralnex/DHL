import { getDataSource } from "@/lib/db/data-source";
import { RouteSegment, Shipment, TrackingEvent } from "@/lib/db/entities";
import { computePosition } from "@/lib/simulation/position";
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

    const now = new Date();
    const position = computePosition(segments, events, now);

    return NextResponse.json({
      trackingNumber: ship.trackingNumber,
      now: now.toISOString(),
      position,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
