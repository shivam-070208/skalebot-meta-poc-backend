import type {
  CampaignButtonRow,
  CampaignContentRow,
  CampaignDetailResponse,
  CampaignListItem,
  CampaignRecipientRow,
  CampaignRow,
  ContactRow,
  PublicCampaign,
  PublicCampaignButton,
  PublicCampaignContent,
  PublicCampaignRecipient,
} from "@/types/campaign";

export const mapCampaignRow = (row: CampaignRow): PublicCampaign => ({
  id: row.id,
  accountId: row.account_id,
  name: row.name,
  description: row.description,
  status: row.status,
  audienceScope: row.audience_scope ?? "specific",
  scheduledAt: row.scheduled_at?.toISOString() ?? null,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapButtonRow = (row: CampaignButtonRow): PublicCampaignButton => ({
  id: row.id,
  label: row.label,
  actionType: row.action_type,
  actionValue: row.action_value,
  position: row.position,
});

export const mapContentRow = (
  row: CampaignContentRow,
  buttons: CampaignButtonRow[]
): PublicCampaignContent => ({
  id: row.id,
  contentType: row.content_type,
  textContent: row.text_content,
  mediaUrl: row.media_url,
  linkUrl: row.link_url,
  position: row.position,
  buttons: buttons
    .filter((b) => b.campaign_content_id === row.id)
    .sort((a, b) => a.position - b.position)
    .map(mapButtonRow),
});

export const mapRecipientRow = (
  row: CampaignRecipientRow,
  contact?: ContactRow
): PublicCampaignRecipient => {
  const hasWindow =
    contact?.window_expires_at != null &&
    contact.window_expires_at.getTime() > Date.now();

  return {
    id: row.id,
    contactId: row.contact_id,
    status: row.status,
    sentAt: row.sent_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    ...(contact && {
      contact: {
        id: contact.id,
        instagramUserId: contact.instagram_user_id,
        username: contact.username,
        windowExpiresAt: contact.window_expires_at?.toISOString() ?? null,
        hasMessagingWindow: hasWindow,
      },
    }),
  };
};

export const mapCampaignDetail = (
  campaign: CampaignRow,
  contents: CampaignContentRow[],
  buttons: CampaignButtonRow[],
  recipients: CampaignRecipientRow[],
  contactsById: Map<string, ContactRow>
): CampaignDetailResponse => ({
  ...mapCampaignRow(campaign),
  contents: contents
    .sort((a, b) => a.position - b.position)
    .map((c) => mapContentRow(c, buttons)),
  recipients: recipients.map((r) =>
    mapRecipientRow(r, contactsById.get(r.contact_id))
  ),
});

export const mapCampaignListItem = (
  row: CampaignRow & { recipient_count: string; content_count: string }
): CampaignListItem => ({
  ...mapCampaignRow(row),
  recipientCount: Number(row.recipient_count) || 0,
  contentCount: Number(row.content_count) || 0,
});
