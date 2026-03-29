import { getDataSource } from "@/lib/db/data-source";
import { Shipment, TrackingEvent } from "@/lib/db/entities";
import { scheduleNotificationEmails } from "@/lib/queue/notification-queue";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ trackingNumber: string; eventId: string }> },
) {
  try {
    const { trackingNumber, eventId } = await ctx.params;
    const ds = await getDataSource();

    const shipment = await ds.getRepository(Shipment).findOne({
      where: { trackingNumber },
      select: ["id"],
    });
    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const eventRepo = ds.getRepository(TrackingEvent);
    const event = await eventRepo.findOne({
      where: { id: eventId, shipmentId: shipment.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const events = await eventRepo.find({
      where: { shipmentId: shipment.id },
      order: { sortOrder: "ASC" },
    });
    const nextPending = events.find((e) => e.source !== "admin");
    if (nextPending && nextPending.id !== event.id) {
      return NextResponse.json(
        { error: "Approve points in order. Confirm the next pending point first." },
        { status: 409 },
      );
    }

    event.source = "admin";
    event.occurredAt = new Date();
    event.notifyEmail = true;
    await eventRepo.save(event);
    try {
      await scheduleNotificationEmails([
        { trackingEventId: event.id, runAt: new Date(), forceSend: true },
      ]);
    } catch (err) {
      console.error(
        "[approveEvent] queue:",
        err instanceof Error ? err.message : err,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
