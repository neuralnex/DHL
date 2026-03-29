import { getDataSource } from "@/lib/db/data-source";
import { RouteSegment, Shipment, TrackingEvent } from "@/lib/db/entities";
import { scheduleNotificationEmails } from "@/lib/queue/notification-queue";
import { generateReferenceCode } from "@/lib/shipment/reference-code";
import { resolveRouteAnchors } from "@/lib/simulation/endpoints";
import { planGlobalRoute } from "@/lib/simulation/planner";
import { generateTrackingNumber } from "@/lib/simulation/tracking-number";

async function allocateReferenceCode(): Promise<string> {
  const ds = await getDataSource();
  const repo = ds.getRepository(Shipment);
  for (let i = 0; i < 24; i++) {
    const code = generateReferenceCode();
    const taken = await repo.findOne({
      where: { referenceCode: code },
      select: ["id"],
    });
    if (!taken) return code;
  }
  return `REF-${Date.now()}`;
}

export async function createShipment(input: {
  originLabel: string;
  destinationLabel: string;
  originCoords?: { lng: number; lat: number } | null;
  destinationCoords?: { lng: number; lat: number } | null;
  receiverEmail: string;
  senderEmail: string;
  weightKg: number;
  estimatedDeliveryAt?: string | null;
  customerName?: string | null;
  serviceLevel?: string | null;
  internalNotes?: string | null;
}): Promise<{
  trackingNumber: string;
  shipmentId: string;
  notificationScheduleError?: string;
}> {
  const ds = await getDataSource();
  const { origin, destination, originCityId, destCityId } = resolveRouteAnchors(
    input.originLabel,
    input.destinationLabel,
    {
      originCoords: input.originCoords ?? null,
      destinationCoords: input.destinationCoords ?? null,
    },
  );
  const { segments: plannedSegments, events: plannedEvents } =
    planGlobalRoute(origin, destination);

  const createdAt = new Date();
  const maxOffset = Math.max(
    ...plannedEvents.map((e) => e.offsetMinutes),
    0,
  );
  const plannedEstimatedDeliveryAt = new Date(
    createdAt.getTime() + maxOffset * 60 * 1000,
  );
  const requestedEta = input.estimatedDeliveryAt
    ? new Date(input.estimatedDeliveryAt)
    : null;
  const estimatedDeliveryAt =
    requestedEta && !Number.isNaN(requestedEta.getTime())
      ? requestedEta
      : plannedEstimatedDeliveryAt;

  const trackingNumber = generateTrackingNumber();
  const referenceCode = await allocateReferenceCode();

  const shipment = ds.getRepository(Shipment).create({
    trackingNumber,
    referenceCode,
    status: "in_transit",
    originLabel: input.originLabel,
    destinationLabel: input.destinationLabel,
    receiverEmail: input.receiverEmail,
    senderEmail: input.senderEmail.trim(),
    weightKg: input.weightKg,
    customerName: input.customerName?.trim() || null,
    serviceLevel: input.serviceLevel?.trim() || "Standard",
    internalNotes: input.internalNotes?.trim() || null,
    createdAt,
    estimatedDeliveryAt,
    metadata: {
      profile: "global",
      originCityId,
      destCityId,
      originCoords: input.originCoords ?? null,
      destinationCoords: input.destinationCoords ?? null,
    },
  });

  await ds.getRepository(Shipment).save(shipment);

  const segmentEntities = plannedSegments.map((ps) =>
    ds.getRepository(RouteSegment).create({
      shipmentId: shipment.id,
      sequence: ps.sequence,
      mode: ps.mode,
      fromLabel: ps.fromLabel,
      toLabel: ps.toLabel,
      path: ps.path,
      distanceKm: ps.distanceKm,
      durationMinutes: ps.durationMinutes,
    }),
  );
  await ds.getRepository(RouteSegment).save(segmentEntities);

  let order = 0;
  const eventEntities: TrackingEvent[] = [];
  for (const pe of plannedEvents) {
    const occurredAt = new Date(
      createdAt.getTime() + pe.offsetMinutes * 60 * 1000,
    );
    const ev = ds.getRepository(TrackingEvent).create({
      shipmentId: shipment.id,
      segmentSequence: pe.segmentSequence,
      code: pe.code,
      label: pe.label,
      occurredAt,
      notifyEmail: pe.notifyEmail,
      sortOrder: order++,
      source: "system",
    });
    eventEntities.push(ev);
  }
  await ds.getRepository(TrackingEvent).save(eventEntities);

  const notifyJobs = eventEntities
    .filter((e) => e.notifyEmail)
    .map((e) => ({
      trackingEventId: e.id,
      runAt: e.occurredAt,
    }));

  let notificationScheduleError: string | undefined;
  try {
    await scheduleNotificationEmails(notifyJobs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    notificationScheduleError = msg;
    console.error(
      "[createShipment] Notification queue unavailable:",
      msg,
    );
  }

  return {
    trackingNumber,
    shipmentId: shipment.id,
    ...(notificationScheduleError
      ? { notificationScheduleError }
      : {}),
  };
}
