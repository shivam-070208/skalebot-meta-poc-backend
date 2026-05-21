export type WebhookTriggerType = "message" | "comment" | "keyword";

export type ParsedMetaWebhookEvent = {
  instagramAccountId: string;
  triggerType: WebhookTriggerType;
  triggerValue: string;
  senderId: string;
  raw: unknown;
};
