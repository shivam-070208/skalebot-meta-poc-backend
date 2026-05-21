import { Worker } from "bullmq";
import { redisConnection } from "@/config/redis.js";
import { QUEUE_NAMES } from "@/config/queues.js";
import { findPostById } from "@/repositories/post.repository.js";
import { executeAutomationAction } from "@/services/automation-execution.service.js";
import type { AutomationJobData } from "@/types/queue.js";

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
        caption: post.caption,
        mediaUrl: post.media_url,
      });
    },
    { connection: redisConnection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error("Automation job failed", job?.id, err);
  });

  return worker;
};
