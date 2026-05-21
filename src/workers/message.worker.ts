import { Worker } from "bullmq";
import { redisConnection } from "@/config/redis.js";
import { QUEUE_NAMES } from "@/config/queues.js";
import { sendInstagramMessage } from "@/services/instagram-message.service.js";
import type { MessageJobData } from "@/types/queue.js";

export const startMessageWorker = (): Worker<MessageJobData> => {
  const worker = new Worker<MessageJobData>(
    QUEUE_NAMES.message,
    async (job) => {
      await sendInstagramMessage(job.data);
    },
    { connection: redisConnection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(
      "Message job failed",
      job?.id,
      err instanceof Error ? err.message : err
    );
  });

  return worker;
};
