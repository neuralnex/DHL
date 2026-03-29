import "dotenv/config";
import "reflect-metadata";
import { Worker } from "bullmq";
import { getDataSource } from "./lib/db/data-source";
import {
  NotificationLog,
  Shipment,
  TrackingEvent,
} from "./lib/db/entities";
import { sendShipmentNotificationEmail } from "./lib/email/smtp";
import type { NotificationJobData } from "./lib/queue/notification-queue";
import { getRedisConnection } from "./lib/queue/redis";

const QUEUE_NAME = "notification";

async function processJob(data: NotificationJobData): Promise<void> {
  const ds = await getDataSource();
  const eventRepo = ds.getRepository(TrackingEvent);
  const ev = await eventRepo.findOne({
    where: { id: data.trackingEventId },
  });
  if (!ev) {
    console.warn("[worker] Missing event", data.trackingEventId);
    return;
  }

  const existing = await ds.getRepository(NotificationLog).findOne({
    where: { trackingEventId: ev.id, status: "sent" },
  });
  if (existing && !data.forceSend) return;

  const shipment = await ds.getRepository(Shipment).findOne({
    where: { id: ev.shipmentId },
  });
  if (!shipment) return;

  const subjectLine = `[${shipment.trackingNumber}] ${ev.label}`;
  const bodyText = [
    `Shipment ${shipment.trackingNumber}`,
    ``,
    `Update: ${ev.label}`,
    `Route: ${shipment.originLabel} → ${shipment.destinationLabel}`,
    ``,
    `Time (UTC): ${ev.occurredAt.toISOString()}`,
  ].join("\n");

  const recipients: string[] = [shipment.receiverEmail];
  if (shipment.senderEmail?.trim()) {
    recipients.push(shipment.senderEmail.trim());
  }

  try {
    await sendShipmentNotificationEmail({
      to: recipients,
      trackingNumber: shipment.trackingNumber,
      subjectLine,
      bodyText,
    });
    await ds.getRepository(NotificationLog).save(
      ds.getRepository(NotificationLog).create({
        trackingEventId: ev.id,
        channel: "email",
        status: "sent",
        sentAt: new Date(),
        errorMessage: null,
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ds.getRepository(NotificationLog).save(
      ds.getRepository(NotificationLog).create({
        trackingEventId: ev.id,
        channel: "email",
        status: "failed",
        sentAt: null,
        errorMessage: msg,
      }),
    );
    throw err;
  }
}

async function main() {
  await getDataSource();
  const connection = getRedisConnection();

  const worker = new Worker<NotificationJobData>(
    QUEUE_NAME,
    async (job) => {
      await processJob(job.data);
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error("[worker] Job failed", job?.id, err);
  });

  console.log("[worker] Listening on queue", QUEUE_NAME);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
