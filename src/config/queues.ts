import { Queue } from "bullmq";
import { redisConnection } from "@/config/redis";
import type {
  AutomationJobData,
  CampaignQueueJobData,
  PublishJobData,
} from "@/types/queue";
import { CampaignContent } from "@/services/instagram-message.service";

export const QUEUE_NAMES = {
  publish: "publish",
  message: "message",
  automation: "automation",
  campaign: "campaign",
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

export const messageQueue = new Queue<{
  accountId: string;
  recipientId: string;
  contents: CampaignContent[];
}>(QUEUE_NAMES.message, {
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

export const campaignQueue = new Queue<CampaignQueueJobData>(
  QUEUE_NAMES.campaign,
  {
    connection: redisConnection,
    defaultJobOptions,
  }
);
