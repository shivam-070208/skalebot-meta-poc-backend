import { Worker } from "bullmq";
import { redisConnection } from "@/config/redis";
import { QUEUE_NAMES } from "@/config/queues";
import { findPostById } from "@/repositories/post.repository";
import { executeAutomationAction } from "@/services/automation-execution.service";
import type { AutomationJobData } from "@/types/queue";

export const startAutomationWorker = (): Worker<AutomationJobData> => {
  const worker = new Worker<AutomationJobData>(
    QUEUE_NAMES.automation,
    async (job) => {
    
      const post = await findPostById(job.data.postId);

      if (!post) {
        throw new Error(`Post ${job.data.postId} not found`);
      }
    
      await executeAutomationAction({
        actionType: job.data.actionType,
        accountId: job.data.accountId,
        recipientId: job.data.recipientId,
        actionValue:job.data.actionValue
      });
    },
    { connection: redisConnection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error("Automation job failed", job?.id, err.message);
  });

  return worker;
};
