import { Worker } from "bullmq";
import { redisConnection } from "@/config/redis";
import { QUEUE_NAMES } from "@/config/queues";
import { updatePostPublishStatus, setPostExternalMediaId } from "@/repositories/post.repository";
import { findPostById } from "@/repositories/post.repository";
import { publishPostToInstagram } from "@/services/instagram-publish.service";
import type { PublishJobData } from "@/types/queue";
import { AxiosError } from "axios";

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
        const result = await publishPostToInstagram({
          postId: post.id,
          accountId: post.account_id,
        });


        if (result.externalMediaId) {
          await setPostExternalMediaId(post.id, result.externalMediaId);
        }

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
