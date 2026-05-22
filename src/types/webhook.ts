export type WebhookTriggerType = "message" | "comment" | "keyword";

export type ParsedMetaWebhookEvent = {
  instagramAccountId: string;
  triggerType: WebhookTriggerType;
  triggerValue: string;
  senderId: string;
  username: string | null;
  notificationToken: string | null;
  postbackPayload: string | null;
  isEcho: boolean;
  /** Direct message to the business account */
  isIncomingMessage: boolean;
  raw: unknown;
};
