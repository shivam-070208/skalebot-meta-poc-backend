import type { ActionType } from "@/types/automation.js";
import type { CampaignQueueJobData } from "@/types/campaign.js";

export type PublishJobData = {
  postId: string;
};



export type AutomationJobData = {
  ruleId: string;
  postId: string;
  accountId: string;
  recipientId: string;
  actionType: ActionType;
};

export type { CampaignQueueJobData };
