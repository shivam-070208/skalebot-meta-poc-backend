import {
  BUTTON_ACTION_TYPES,
  CAMPAIGN_PUBLISH_TYPES,
  CAMPAIGN_STATUSES,
  CONTENT_TYPES,
} from "@/types/campaign";
import type {
  CampaignListQuery,
  CampaignPublishType,
  CampaignStatus,
  CreateCampaignDto,
  UpdateCampaignDto,
} from "@/types/campaign";
import ApiError from "@/utils/api-error";
import { parseRecipientIdsInput } from "@/utils/campaign-recipients";
import { parseLimit, parsePage } from "@/utils/pagination";

const parseBody = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};

const parseOptionalString = (v: unknown): string | null => {
  if (v === undefined || v === null || v === "") return null;
  return typeof v === "string" ? v.trim() : null;
};

const parseButton = (
  raw: unknown,
  index: number
): CreateCampaignDto["contents"][0]["buttons"][0] => {
  const b = parseBody(raw);
  const label = typeof b.label === "string" ? b.label.trim() : "";
  if (!label) {
    throw new ApiError("HTTP_400_BAD_REQUEST", `buttons[${index}].label is required`);
  }
  const actionTypeRaw =
    typeof b.action_type === "string" ? b.action_type.trim().toLowerCase() : "";
  if (
    !BUTTON_ACTION_TYPES.includes(
      actionTypeRaw as (typeof BUTTON_ACTION_TYPES)[number]
    )
  ) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `buttons[${index}].action_type is invalid`
    );
  }
  const position =
    typeof b.position === "number" && Number.isFinite(b.position)
      ? b.position
      : index;
  return {
    label,
    actionType: actionTypeRaw as CreateCampaignDto["contents"][0]["buttons"][0]["actionType"],
    actionValue: parseOptionalString(b.action_value),
    position,
  };
};

const parseContent = (
  raw: unknown,
  index: number
): CreateCampaignDto["contents"][0] => {
  const c = parseBody(raw);
  const contentTypeRaw =
    typeof c.content_type === "string"
      ? c.content_type.trim().toLowerCase()
      : "";
  if (
    !CONTENT_TYPES.includes(
      contentTypeRaw as (typeof CONTENT_TYPES)[number]
    )
  ) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `contents[${index}].content_type is invalid`
    );
  }
  const buttonsRaw = Array.isArray(c.buttons) ? c.buttons : [];
  const position =
    typeof c.position === "number" && Number.isFinite(c.position)
      ? c.position
      : index;
  return {
    contentType: contentTypeRaw as CreateCampaignDto["contents"][0]["contentType"],
    textContent: parseOptionalString(c.text_content),
    mediaUrl: parseOptionalString(c.media_url),
    linkUrl: parseOptionalString(c.link_url),
    position,
    buttons: buttonsRaw.map((btn, i) => parseButton(btn, i)),
  };
};

const parsePublishType = (b: Record<string, unknown>): CampaignPublishType => {
  const raw =
    typeof b.publish_type === "string"
      ? b.publish_type.trim().toLowerCase()
      : typeof b.status === "string"
        ? b.status.trim().toLowerCase()
        : "draft";
  if (
    !CAMPAIGN_PUBLISH_TYPES.includes(
      raw as (typeof CAMPAIGN_PUBLISH_TYPES)[number]
    )
  ) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `publish_type must be one of: ${CAMPAIGN_PUBLISH_TYPES.join(", ")}`
    );
  }
  return raw as CampaignPublishType;
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

export const parseCreateCampaignBody = (body: unknown): CreateCampaignDto => {
  const b = parseBody(body);
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "name is required");
  }

  const publishType = parsePublishType(b);
  const scheduledAt = parseScheduledAt(b.scheduled_at);

  if (publishType === "scheduled" && !scheduledAt) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "scheduled_at is required when publish_type is scheduled"
    );
  }
  if (
    publishType === "scheduled" &&
    scheduledAt &&
    scheduledAt.getTime() <= Date.now()
  ) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "scheduled_at must be in the future"
    );
  }

  const contentsRaw = Array.isArray(b.contents) ? b.contents : [];
  const { audienceScope, recipientIds } = parseRecipientIdsInput(
    b.recipient_ids
  );

  return {
    name,
    description: parseOptionalString(b.description),
    publishType,
    scheduledAt: publishType === "scheduled" ? scheduledAt : null,
    contents: contentsRaw.map((c, i) => parseContent(c, i)),
    audienceScope,
    recipientIds,
  };
};

export const parseUpdateCampaignBody = (body: unknown): UpdateCampaignDto => {
  const b = parseBody(body);
  const out: UpdateCampaignDto = {};

  if (b.name !== undefined) {
    const name = typeof b.name === "string" ? b.name.trim() : "";
    if (!name) throw new ApiError("HTTP_400_BAD_REQUEST", "name cannot be empty");
    out.name = name;
  }
  if (b.description !== undefined) {
    out.description = parseOptionalString(b.description);
  }
  if (b.publish_type !== undefined || b.status !== undefined) {
    out.publishType = parsePublishType(b);
  }
  if (b.scheduled_at !== undefined) {
    out.scheduledAt = parseScheduledAt(b.scheduled_at);
  }
  if (b.contents !== undefined) {
    if (!Array.isArray(b.contents)) {
      throw new ApiError("HTTP_400_BAD_REQUEST", "contents must be an array");
    }
    out.contents = b.contents.map((c, i) => parseContent(c, i));
  }
  if (b.recipient_ids !== undefined) {
    const parsed = parseRecipientIdsInput(b.recipient_ids);
    out.audienceScope = parsed.audienceScope;
    out.recipientIds = parsed.recipientIds;
  }

  return out;
};

export const parseCampaignListQuery = (query: unknown): CampaignListQuery => {
  const q =
    query !== null && typeof query === "object"
      ? (query as Record<string, unknown>)
      : {};

  const page = parsePage(q.page);
  const limit = parseLimit(q.limit);
  const search =
    typeof q.search === "string" && q.search.trim().length > 0
      ? q.search.trim()
      : null;

  let status: CampaignStatus | null = null;
  if (typeof q.status === "string" && q.status.trim()) {
    const s = q.status.trim().toLowerCase();
    if (!CAMPAIGN_STATUSES.includes(s as CampaignStatus)) {
      throw new ApiError("HTTP_400_BAD_REQUEST", "Invalid status filter");
    }
    status = s as CampaignStatus;
  }

  return { page, limit, search, status };
};
