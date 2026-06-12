export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "instant",
  "active",
  "completed",
  "failed",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/** User-facing publish intent when creating/updating */
export const CAMPAIGN_PUBLISH_TYPES = ["draft", "scheduled", "instant"] as const;
export type CampaignPublishType = (typeof CAMPAIGN_PUBLISH_TYPES)[number];

export const CONTENT_TYPES = [
  "text",
  "image",
  "video",
  "link",
  "template",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const BUTTON_ACTION_TYPES = [
  "open_url",
  "reply",
  "trigger_campaign",
  "trigger_post",
] as const;
export type ButtonActionType = (typeof BUTTON_ACTION_TYPES)[number];

export const RECIPIENT_STATUSES = ["pending", "sent", "failed"] as const;
export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];

/** Pass in recipient_ids to target all subscribed contacts */
export const ALL_RECIPIENTS_TOKENS = ["*", "all"] as const;

export const AUDIENCE_SCOPES = ["specific", "all_subscribers"] as const;
export type AudienceScope = (typeof AUDIENCE_SCOPES)[number];

export type CampaignRow = {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  status: string;
  audience_scope: string;
  scheduled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type CampaignContentRow = {
  id: string;
  campaign_id: string;
  content_type: string;
  text_content: string | null;
  media_url: string | null;
  link_url: string | null;
  position: number;
  buttons:CreateCampaignButtonInput[];
  created_at: Date;
};

export type CampaignButtonRow = {
  id: string;
  campaign_content_id: string;
  label: string;
  action_type: string;
  action_value: string | null;
  position: number;
  created_at: Date;
};

export type CampaignRecipientRow = {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: string;
  sent_at: Date | null;
  created_at: Date;
};

export type ContactRow = {
  id: string;
  account_id: string;
  instagram_user_id: string | null;
  username: string | null;
  is_subscribed: boolean;
  window_expires_at: Date | null;
  notification_token: string | null;
  created_at: Date;
};

export type CreateCampaignButtonInput = {
  label: string;
  actionType: ButtonActionType;
  actionValue: string | null;
  position: number;
};

export type CreateCampaignContentInput = {
  contentType: ContentType;
  textContent: string | null;
  mediaUrl: string | null;
  linkUrl: string | null;
  position: number;
  buttons: CreateCampaignButtonInput[];
};

export type CreateCampaignDto = {
  name: string;
  description: string | null;
  publishType: CampaignPublishType;
  scheduledAt: Date | null;
  contents: CreateCampaignContentInput[];
  audienceScope: AudienceScope;
  recipientIds: string[];
};

export type UpdateCampaignDto = Partial<
  Omit<CreateCampaignDto, "publishType">
> & {
  publishType?: CampaignPublishType;
  status?: CampaignStatus;
  audienceScope?: AudienceScope;
};

export type PublicCampaignButton = {
  id: string;
  label: string;
  actionType: string;
  actionValue: string | null;
  position: number;
};

export type PublicCampaignContent = {
  id: string;
  contentType: string;
  textContent: string | null;
  mediaUrl: string | null;
  linkUrl: string | null;
  position: number;
  buttons: PublicCampaignButton[];
};

export type PublicCampaignRecipient = {
  id: string;
  contactId: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  contact?: {
    id: string;
    instagramUserId: string | null;
    username: string | null;
    windowExpiresAt: string | null;
    hasMessagingWindow: boolean;
  };
};

export type PublicCampaign = {
  id: string;
  accountId: string;
  name: string;
  description: string | null;
  status: string;
  audienceScope: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignDetailResponse = PublicCampaign & {
  contents: PublicCampaignContent[];
  recipients: PublicCampaignRecipient[];
};

export type CampaignListItem = PublicCampaign & {
  recipientCount: number;
  contentCount: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginationResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type CampaignListQuery = {
  page: number;
  limit: number;
  search: string | null;
  status: CampaignStatus | null;
};

export type CampaignQueueJobData = {
  campaignId: string;
  accountId: string;
  mode: "instant" | "scheduled";
};
