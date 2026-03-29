import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

const QUEUE_NAME = "notification";

let queue: Queue | null = null;

export function getNotificationQueue(): Queue {
  if (queue) return queue;
  queue = new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
  return queue;
}

export interface NotificationJobData {
  trackingEventId: string;
  forceSend?: boolean;
}

export async function scheduleNotificationEmails(
  jobs: { trackingEventId: string; runAt: Date; forceSend?: boolean }[],
): Promise<void> {
  const q = getNotificationQueue();
  for (const j of jobs) {
    const delay = Math.max(0, j.runAt.getTime() - Date.now());
    const jobId = j.forceSend
      ? `${j.trackingEventId}:force:${Date.now()}`
      : j.trackingEventId;
    await q.add(
      "send-email",
      {
        trackingEventId: j.trackingEventId,
        ...(j.forceSend ? { forceSend: true } : {}),
      } satisfies NotificationJobData,
      {
        jobId,
        delay,
      },
    );
  }
}
