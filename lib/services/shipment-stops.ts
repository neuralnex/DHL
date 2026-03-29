import { getDataSource } from "@/lib/db/data-source";
import { TrackingEvent } from "@/lib/db/entities";
import { scheduleNotificationEmails } from "@/lib/queue/notification-queue";

export async function addShipmentStop(input: {
  shipmentId: string;
  label: string;
  occurredAt: Date;
  notifyEmail: boolean;
}): Promise<TrackingEvent> {
  const ds = await getDataSource();
  const repo = ds.getRepository(TrackingEvent);

  const raw = await repo
    .createQueryBuilder("e")
    .select("MAX(e.sortOrder)", "max")
    .where("e.shipmentId = :id", { id: input.shipmentId })
    .getRawOne<{ max: string | null }>();

  const maxOrder =
    raw?.max != null && raw.max !== "" ? Number.parseInt(raw.max, 10) : -1;

  const ev = repo.create({
    shipmentId: input.shipmentId,
    segmentSequence: null,
    code: `admin_${Date.now()}`,
    label: input.label,
    occurredAt: input.occurredAt,
    notifyEmail: input.notifyEmail,
    sortOrder: Number.isFinite(maxOrder) ? maxOrder + 1 : 0,
    source: "admin",
  });
  await repo.save(ev);

  if (input.notifyEmail) {
    try {
      await scheduleNotificationEmails([
        {
          trackingEventId: ev.id,
          runAt: input.occurredAt,
        },
      ]);
    } catch (err) {
      console.error(
        "[addShipmentStop] queue:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return ev;
}
