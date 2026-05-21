import { Queue } from "bullmq";
import { redisConnection } from "@/config/redis.js";
import type {
  AutomationJobData,
  MessageJobData,
  PublishJobData,
} from "@/types/queue.js";

export const QUEUE_NAMES = {
  publish: "publish",
  message: "message",
  automation: "automation",
} as const;

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export const publishQueue = new Queue<PublishJobData>(QUEUE_NAMES.publish, {
  connection: redisConnection,
  defaultJobOptions,
});

export const messageQueue = new Queue<MessageJobData>(QUEUE_NAMES.message, {
  connection: redisConnection,
  defaultJobOptions,
});

export const automationQueue = new Queue<AutomationJobData>(
  QUEUE_NAMES.automation,
  {
    connection: redisConnection,
    defaultJobOptions,
  }
);
