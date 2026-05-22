import { Worker } from "bullmq";
import { randomUUID } from "crypto";

import { redisConnection } from "@/config/redis";
import { QUEUE_NAMES, messageQueue } from "@/config/queues";
import type { CampaignQueueJobData } from "@/types/campaign";
import { findCampaignById, findCampaignContents } from "@/repositories/campaign.repository";
import { findSubscribedContactsForAccount } from "@/repositories/contact.repository";

export const startCampaignWorker = (): Worker<CampaignQueueJobData> => {
  return new Worker(
    QUEUE_NAMES.campaign,
    async (job) => {
      const { campaignId, accountId } = job.data;

      const campaign = await findCampaignById(campaignId, accountId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const contents = await findCampaignContents(campaignId);
      if (!contents.length) {
        console.log("No campaign contents");
        return;
      }

      const contacts = await findSubscribedContactsForAccount(accountId);
      if (!contacts.length) {
        console.log("No contacts");
        return;
      }

      for (const contact of contacts) {
        const now = new Date();
        const expired =
          contact.window_expires_at &&
          new Date(contact.window_expires_at) < now;
        const hasNotification = !!contact.notification_token;

        if (expired && !hasNotification) {
          continue;
        }

        await messageQueue.add(
          "send-message",
          {
            accountId,
            recipientId: contact.instagram_user_id,
            contents: contents.map((c) => ({
              content_type: c.content_type,
              text_content: c.text_content,
              media_url: c.media_url,
              link_url: c.link_url,
              buttons: c.buttons || [],
            })),
            campaignId,
            contactId: contact.id,
            notificationToken: contact.notification_token,
          },
          {
            jobId: `campaign-msg-${campaignId}-${contact.id}-${randomUUID()}`,
            removeOnComplete: true,
            removeOnFail: true,
          }
        );
      }

      console.log(
        `Campaign ${campaignId} queued for ${contacts.length} contacts`
      );
    },
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );
};