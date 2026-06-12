import {
  mapCampaignDetail,
  mapCampaignListItem,
  mapCampaignRow,
  mapRecipientRow,
} from "@/mappers/campaign.mapper";
import { enqueueCampaignSend } from "@/queues/campaign.queue";
import { findPrimaryAccountForUser } from "@/repositories/account.repository";
import {
  countCampaigns,
  createCampaignWithRelations,
  findCampaignById,
  findCampaignButtons,
  findCampaignContents,
  findCampaignRecipients,
  listCampaigns,
  softDeleteCampaign,
  updateCampaignWithRelations,
} from "@/repositories/campaign.repository";
import {
  findContactsByCampaignId,
  findContactsByIdsForAccount,
  findSubscribedContactsForAccount,
} from "@/repositories/contact.repository";
import type { AudienceScope } from "@/types/campaign";
import type {
  CampaignDetailResponse,
  CampaignListQuery,
  CampaignPublishType,
  CreateCampaignDto,
  PaginationResponse,
  UpdateCampaignDto,
} from "@/types/campaign";
import type { CampaignListItem } from "@/types/campaign";
import ApiError from "@/utils/api-error";
import { paginationMeta } from "@/utils/pagination";

const publishTypeToStatus = (publishType: CampaignPublishType): string => {
  if (publishType === "draft") return "draft";
  if (publishType === "scheduled") return "scheduled";
  return "instant";
};

const computeDelayMs = (scheduledAt: Date): number => {
  const delay = scheduledAt.getTime() - Date.now();
  return delay > 0 ? delay : 0;
};

const resolveAccountId = async (userId: string): Promise<string> => {
  const account = await findPrimaryAccountForUser(userId);
  if (!account) {
    throw new ApiError(
      "HTTP_404_NOT_FOUND",
      "No connected Instagram account. Connect via /api/v1/auth/instagram first."
    );
  }
  return account.id;
};

const resolveCampaignRecipients = async (
  accountId: string,
  audienceScope: AudienceScope,
  recipientIds: string[]
): Promise<{ audienceScope: AudienceScope; contactIds: string[] }> => {
  if (audienceScope === "all_subscribers") {
    const contacts = await findSubscribedContactsForAccount(accountId);
    if (contacts.length === 0) {
      throw new ApiError(
        "HTTP_400_BAD_REQUEST",
        "No subscribed contacts found for this account"
      );
    }
    return {
      audienceScope: "all_subscribers",
      contactIds: contacts.map((c) => c.id),
    };
  }

  if (recipientIds.length === 0) {
    return { audienceScope: "specific", contactIds: [] };
  }

  const found = await findContactsByIdsForAccount(accountId, recipientIds);
  if (found.length !== recipientIds.length) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "One or more recipient_ids are invalid for this account"
    );
  }

  return { audienceScope: "specific", contactIds: recipientIds };
};

const maybeEnqueueCampaign = async (
  campaignId: string,
  accountId: string,
  publishType: CampaignPublishType,
  scheduledAt: Date | null
): Promise<void> => {
  if (publishType === "draft") return;

  if (publishType === "instant") {
    await enqueueCampaignSend({
      campaignId,
      accountId,
      mode: "instant",
    });
    return;
  }

  if (publishType === "scheduled" && scheduledAt) {
    await enqueueCampaignSend(
      {
        campaignId,
        accountId,
        mode: "scheduled",
      },
      computeDelayMs(scheduledAt)
    );
  }
};

export const createCampaign = async (
  userId: string,
  input: CreateCampaignDto
): Promise<CampaignDetailResponse> => {
  const accountId = await resolveAccountId(userId);
  const resolved = await resolveCampaignRecipients(
    accountId,
    input.audienceScope,
    input.recipientIds
  );

  const status = publishTypeToStatus(input.publishType);
  const campaign = await createCampaignWithRelations({
    accountId,
    name: input.name,
    description: input.description,
    status,
    audienceScope: resolved.audienceScope,
    scheduledAt: input.scheduledAt,
    contents: input.contents,
    recipientIds: resolved.contactIds,
  });

  await maybeEnqueueCampaign(
    campaign.id,
    accountId,
    input.publishType,
    input.scheduledAt
  );

  return getCampaignById(userId, campaign.id);
};

export const getCampaigns = async (
  userId: string,
  query: CampaignListQuery
): Promise<PaginationResponse<CampaignListItem>> => {
  const accountId = await resolveAccountId(userId);
  const total = await countCampaigns(accountId, query);
  const rows = await listCampaigns(accountId, query);

  return {
    items: rows.map(mapCampaignListItem),
    pagination: paginationMeta(query.page, query.limit, total),
  };
};

export const searchCampaigns = async (
  userId: string,
  query: CampaignListQuery
): Promise<PaginationResponse<CampaignListItem>> => getCampaigns(userId, query);

export const getCampaignById = async (
  userId: string,
  campaignId: string
): Promise<CampaignDetailResponse> => {
  const accountId = await resolveAccountId(userId);
  const campaign = await findCampaignById(campaignId, accountId);
  if (!campaign) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Campaign not found");
  }

  const [contents, buttons, recipients] = await Promise.all([
    findCampaignContents(campaignId),
    findCampaignButtons(campaignId),
    findCampaignRecipients(campaignId),
  ]);

  const contacts = await findContactsByCampaignId(campaignId);
  const contactsById = new Map(contacts.map((c) => [c.id, c]));

  return mapCampaignDetail(
    campaign,
    contents,
    buttons,
    recipients,
    contactsById
  );
};

export const updateCampaign = async (
  userId: string,
  campaignId: string,
  input: UpdateCampaignDto
): Promise<CampaignDetailResponse> => {
  const accountId = await resolveAccountId(userId);

  const fields: Parameters<typeof updateCampaignWithRelations>[2] = {};

  if (input.name !== undefined) fields.name = input.name;
  if (input.description !== undefined) fields.description = input.description;
  if (input.scheduledAt !== undefined) fields.scheduledAt = input.scheduledAt;
  if (input.contents !== undefined) fields.contents = input.contents;

  if (
    input.recipientIds !== undefined ||
    input.audienceScope !== undefined
  ) {
    const scope = input.audienceScope ?? "specific";
    const ids = input.recipientIds ?? [];
    const resolved = await resolveCampaignRecipients(accountId, scope, ids);
    fields.audienceScope = resolved.audienceScope;
    fields.recipientIds = resolved.contactIds;
  }

  if (input.publishType !== undefined) {
    fields.status = publishTypeToStatus(input.publishType);
    fields.scheduledAt =
      input.publishType === "scheduled"
        ? (input.scheduledAt ?? null)
        : input.publishType === "instant"
          ? null
          : input.scheduledAt ?? null;
  } else if (input.status !== undefined) {
    fields.status = input.status;
  }

  const updated = await updateCampaignWithRelations(
    campaignId,
    accountId,
    fields
  );
  if (!updated) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Campaign not found");
  }

  if (input.publishType === "instant" || input.publishType === "scheduled") {
    await maybeEnqueueCampaign(
      campaignId,
      accountId,
      input.publishType,
      input.scheduledAt ?? updated.scheduled_at
    );
  }

  return getCampaignById(userId, campaignId);
};

export const deleteCampaign = async (
  userId: string,
  campaignId: string
): Promise<void> => {
  const accountId = await resolveAccountId(userId);
  const ok = await softDeleteCampaign(campaignId, accountId);
  if (!ok) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Campaign not found");
  }
};

export const getCampaignRecipients = async (
  userId: string,
  campaignId: string
) => {
  const accountId = await resolveAccountId(userId);
  const campaign = await findCampaignById(campaignId, accountId);
  if (!campaign) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Campaign not found");
  }

  const [recipients, contacts] = await Promise.all([
    findCampaignRecipients(campaignId),
    findContactsByCampaignId(campaignId),
  ]);
  const contactsById = new Map(contacts.map((c) => [c.id, c]));

  return {
    campaign: mapCampaignRow(campaign),
    recipients: recipients.map((r) =>
      mapRecipientRow(r, contactsById.get(r.contact_id))
    ),
  };
};

export const getCampaignHistory = async (
  userId: string,
  campaignId: string
) => {
  const accountId = await resolveAccountId(userId);
  const campaign = await findCampaignById(campaignId, accountId);
  if (!campaign) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Campaign not found");
  }

  return {
    campaignId,
    history: [],
    note: "Campaign send history will be available in a future release.",
  };
};
