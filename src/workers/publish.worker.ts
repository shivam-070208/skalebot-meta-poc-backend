import { Worker } from "bullmq";
import { redisConnection } from "@/config/redis.js";
import { QUEUE_NAMES } from "@/config/queues.js";
import { updatePostPublishStatus } from "@/repositories/post.repository.js";
import { findPostById } from "@/repositories/post.repository.js";
import { publishPostToInstagram } from "@/services/instagram-publish.service.js";
import type { PublishJobData } from "@/types/queue.js";

export const startPublishWorker = (): Worker<PublishJobData> => {
  const worker = new Worker<PublishJobData>(
    QUEUE_NAMES.publish,
    async (job) => {
      const post = await findPostById(job.data.postId);
      if (!post) {
        throw new Error(`Post ${job.data.postId} not found`);
      }

      await updatePostPublishStatus(post.id, "publishing");

      try {
        await publishPostToInstagram({
          postId: post.id,
          accountId: post.account_id,
        });
        await updatePostPublishStatus(
          post.id,
          "published",
          new Date()
        );
      } catch (err) {
        await updatePostPublishStatus(post.id, "failed");
        throw err;
      }
    },
    { connection: redisConnection, concurrency: 1 }
  );

  worker.on("failed", (job, err) => {
    console.error("Publish job failed", job?.id);
  });

  return worker;
};
