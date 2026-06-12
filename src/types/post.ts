import type { PublicAutomationRule } from "@/types/automation";

export const PUBLISH_STATUSES = [
  "draft",
  "scheduled",
  "queued",
  "publishing",
  "published",
  "failed",
] as const;

export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const PUBLISH_TYPES = ["instant", "scheduled"] as const;
export type PublishType = (typeof PUBLISH_TYPES)[number];

export type PostRow = {
  id: string;
  account_id: string;
  media_url: string | null;
  caption: string | null;
  scheduled_at: Date | null;
  publish_status: string;
  published_at: Date | null;
  created_at: Date;
  external_media_id?: string | null;
};

export type PublicPost = {
  id: string;
  accountId: string;
  caption: string | null;
  mediaUrl: string | null;
  scheduledAt: string | null;
  publishStatus: string;
  publishedAt: string | null;
  createdAt: string;
  externalMediaId?: string | null;
};

export type CreatePostInput = {
  userId: string;
  accountId: string;
  caption: string | null;
  mediaUrl: string;
  publishType: PublishType;
  scheduledAt: Date | null;
  automationRule: CreatePostAutomationRuleInput | null;
  externalMediaId?: string | null;
};

export type CreatePostAutomationRuleInput = {
  triggerType: string;
  triggerValue: string;
  actionType: string;
  actionValue: string;
};

export type CreatePostResult = {
  post: PublicPost;
  automationRule: PublicAutomationRule | null;
};
