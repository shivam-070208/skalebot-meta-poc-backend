import type { ActionType } from "@/types/automation.js";

export type PublishJobData = {
  postId: string;
};

export type MessageJobData = {
  accountId: string;
  recipientId: string;
  text: string;
};

export type AutomationJobData = {
  ruleId: string;
  postId: string;
  accountId: string;
  recipientId: string;
  actionType: ActionType;
};
