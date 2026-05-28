import { campaignQueue } from "@/config/queues";
import type { CampaignQueueJobData } from "@/types/campaign";

/**
 * Placeholder enqueue — actual send logic (24h window / notification token) comes later.
 */
export const enqueueCampaignSend = async (
  data: CampaignQueueJobData,
  delayMs = 0
): Promise<void> => {
  await campaignQueue.add("campaign-send", data, {
    jobId: `campaign-${data.campaignId}-${data.mode}`,
    delay: delayMs > 0 ? delayMs : undefined,
  });
};
