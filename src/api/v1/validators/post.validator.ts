import {
  ACTION_TYPES,
  TRIGGER_TYPES,
} from "@/types/automation";
import { PUBLISH_TYPES } from "@/types/post";
import type { CreatePostInput } from "@/types/post";
import ApiError from "@/utils/api-error";

const parseBody = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};

const parseAutomationRule = (
  value: unknown
): CreatePostInput["automationRule"] => {
  if (value === undefined || value === null) return null;
  const rule = parseBody(value);

  const triggerType =
    typeof rule.trigger_type === "string"
      ? rule.trigger_type.trim().toLowerCase()
      : "";
  const triggerValue =
    typeof rule.trigger_value === "string" ? rule.trigger_value.trim() : "";
  const actionType =
    typeof rule.action_type === "string"
      ? rule.action_type.trim().toLowerCase()
      : "";
    const actionValue =
      typeof rule.action_value === "string" ? rule.action_value.trim() : "";
  if (
    !TRIGGER_TYPES.includes(triggerType as (typeof TRIGGER_TYPES)[number])
  ) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `trigger_type must be one of: ${TRIGGER_TYPES.join(", ")}`
    );
  }
  if (!triggerValue) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "trigger_value is required");
  }
  if (!ACTION_TYPES.includes(actionType as (typeof ACTION_TYPES)[number])) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `action_type must be one of: ${ACTION_TYPES.join(", ")}`
    );
  }
  
  if (!actionValue) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "action_value is required  "
    );
  }
 
  
  return { triggerType, triggerValue, actionType, actionValue };
};

const parseScheduledAt = (value: unknown): Date | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ApiError("HTTP_400_BAD_REQUEST", "scheduled_at must be a string");
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "scheduled_at is invalid");
  }
  return d;
};

export const parseCreatePostBody = (
  body: unknown,
  userId: string
): CreatePostInput => {
  const b = parseBody(body);

  const accountId =
    typeof b.account_id === "string" ? b.account_id.trim() : "";
  if (!accountId) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "account_id is required");
  }

  const mediaUrl =
    typeof b.media_url === "string" ? b.media_url.trim() : "";
  if (!mediaUrl) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "media_url is required");
  }

  const caption =
    typeof b.caption === "string" && b.caption.trim().length > 0
      ? b.caption.trim()
      : null;

  const publishTypeRaw =
    typeof b.publish_type === "string"
      ? b.publish_type.trim().toLowerCase()
      : "";
  if (
    !PUBLISH_TYPES.includes(publishTypeRaw as (typeof PUBLISH_TYPES)[number])
  ) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `publish_type must be one of: ${PUBLISH_TYPES.join(", ")}`
    );
  }
  const publishType = publishTypeRaw as CreatePostInput["publishType"];

  const scheduledAt = parseScheduledAt(b.scheduled_at);
  if (publishType === "scheduled" && !scheduledAt) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "scheduled_at is required when publish_type is scheduled"
    );
  }

  const automationRule = parseAutomationRule(b.automation_rule);

  return {
    userId,
    accountId,
    caption,
    mediaUrl,
    publishType,
    scheduledAt: publishType === "scheduled" ? scheduledAt : null,
    automationRule,
  };
};
