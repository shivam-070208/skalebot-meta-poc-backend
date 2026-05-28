import type { ActionType } from "@/types/automation";
import type { CampaignQueueJobData } from "@/types/campaign";

export type PublishJobData = {
  postId: string;
};



export type AutomationJobData = {
  ruleId: string;
  postId: string;
  accountId: string;
  recipientId: string;
  actionType: ActionType;
  actionValue:string;
};

export type { CampaignQueueJobData };
