import { Worker } from "bullmq";
import { redisConnection } from "@/config/redis";
import { QUEUE_NAMES } from "@/config/queues";
import { sendCampaign, CampaignContent } from "@/services/instagram-message.service";


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
    { connection: redisConnection, concurrency: 3}
  );

  worker.on("failed", (job, err) => {
    console.error(
      "Message job failed",
      job?.id 
    );
  });

  return worker;
};
