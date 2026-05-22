import { Worker } from "bullmq";
import { redisConnection } from "@/config/redis.js";
import { QUEUE_NAMES } from "@/config/queues.js";
import { sendCampaign, CampaignContent } from "@/services/instagram-message.service.js";


export const startMessageWorker = (): Worker<{
  accountId: string;
  recipientId: string;
  contents: CampaignContent[];
}> => {
  const worker = new Worker<{
    accountId: string;
    recipientId: string;
    contents: CampaignContent[];
  }>(
    QUEUE_NAMES.message,
    async (job) => {
      await sendCampaign(job.data);
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
