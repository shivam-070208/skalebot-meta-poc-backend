import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import { pool, query } from "@/config/db";
import type {
  CampaignButtonRow,
  CampaignContentRow,
  CampaignRecipientRow,
  CampaignRow,
  
  CreateCampaignContentInput,
} from "@/types/campaign";
import type { AudienceScope, CampaignListQuery } from "@/types/campaign";
import { sqlOffset } from "@/utils/pagination";
import ApiError from "@/utils/api-error";

const CAMPAIGN_COLUMNS = `id, account_id, name, description, status, audience_scope,
  scheduled_at, created_at, updated_at, deleted_at`;

type CreateCampaignDbInput = {
  accountId: string;
  name: string;
  description: string | null;
  status: string;
  audienceScope: AudienceScope;
  scheduledAt: Date | null;
  contents: CreateCampaignContentInput[];
  recipientIds: string[];
};

export const findCampaignById = async (
  campaignId: string,
  accountId: string
): Promise<CampaignRow | null> => {
  const res = await query(
    `SELECT ${CAMPAIGN_COLUMNS}
     FROM campaigns
     WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [campaignId, accountId]
  );
  return (res.rows[0] as CampaignRow | undefined) ?? null;
};

export const findCampaignContents = async (
  campaignId: string
): Promise<CampaignContentRow[]> => {
  const res = await query(
    `
    SELECT
      cc.id,
      cc.campaign_id,
      cc.content_type,
      cc.text_content,
      cc.media_url,
      cc.link_url,
      cc.position,
      cc.created_at,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', cb.id,
            'label', cb.label,
            'action_type', cb.action_type,
            'action_value', cb.action_value,
            'position', cb.position
          )
          ORDER BY cb.position
        ) FILTER (
          WHERE cb.id IS NOT NULL
        ),
        '[]'
      ) AS buttons
    FROM campaign_contents cc
    LEFT JOIN campaign_buttons cb
      ON cb.campaign_content_id = cc.id
    WHERE cc.campaign_id = $1
    GROUP BY cc.id
    ORDER BY cc.position ASC
    `,
    [campaignId]
  );
  return res.rows as CampaignContentRow[];
};

export const findCampaignButtons = async (
  campaignId: string
): Promise<CampaignButtonRow[]> => {
  const res = await query(
    `SELECT b.id, b.campaign_content_id, b.label, b.action_type,
            b.action_value, b.position, b.created_at
     FROM campaign_buttons b
     INNER JOIN campaign_contents c ON c.id = b.campaign_content_id
     WHERE c.campaign_id = $1
     ORDER BY b.position ASC`,
    [campaignId]
  );
  return res.rows as CampaignButtonRow[];
};

export const findCampaignRecipients = async (
  campaignId: string
): Promise<CampaignRecipientRow[]> => {
  const res = await query(
    `SELECT id, campaign_id, contact_id, status, sent_at, created_at
     FROM campaign_recipients
     WHERE campaign_id = $1
     ORDER BY created_at ASC`,
    [campaignId]
  );
  return res.rows as CampaignRecipientRow[];
};

export const countCampaigns = async (
  accountId: string,
  filters: Pick<CampaignListQuery, "search" | "status">
): Promise<number> => {
  const params: unknown[] = [accountId];
  let where = `account_id = $1 AND deleted_at IS NULL`;

  if (filters.status) {
    params.push(filters.status);
    where += ` AND status = $${params.length}`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }

  const res = await query(
    `SELECT COUNT(*)::text AS count FROM campaigns WHERE ${where}`,
    params
  );
  return Number((res.rows[0] as { count: string }).count) || 0;
};

export const listCampaigns = async (
  accountId: string,
  filters: CampaignListQuery
): Promise<(CampaignRow & { recipient_count: string; content_count: string })[]> => {
  const params: unknown[] = [accountId];
  let where = `c.account_id = $1 AND c.deleted_at IS NULL`;

  if (filters.status) {
    params.push(filters.status);
    where += ` AND c.status = $${params.length}`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
  }

  params.push(filters.limit, sqlOffset(filters.page, filters.limit));

  const res = await query(
    `SELECT c.id, c.account_id, c.name, c.description, c.status, c.audience_scope,
            c.scheduled_at, c.created_at, c.updated_at, c.deleted_at,
            COUNT(DISTINCT cr.id)::text AS recipient_count,
            COUNT(DISTINCT cc.id)::text AS content_count
     FROM campaigns c
     LEFT JOIN campaign_recipients cr ON cr.campaign_id = c.id
     LEFT JOIN campaign_contents cc ON cc.campaign_id = c.id
     WHERE ${where}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return res.rows as (CampaignRow & {
    recipient_count: string;
    content_count: string;
  })[];
};

const insertContentsAndButtons = async (
  client: PoolClient,
  campaignId: string,
  contents: CreateCampaignContentInput[]
): Promise<void> => {
  for (const content of contents) {
    const contentId = randomUUID();
    await client.query(
      `INSERT INTO campaign_contents (
         id, campaign_id, content_type, text_content, media_url, link_url, position
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contentId,
        campaignId,
        content.contentType,
        content.textContent,
        content.mediaUrl,
        content.linkUrl,
        content.position,
      ]
    );

    for (const button of content.buttons) {
      await client.query(
        `INSERT INTO campaign_buttons (
           id, campaign_content_id, label, action_type, action_value, position
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          contentId,
          button.label,
          button.actionType,
          button.actionValue,
          button.position,
        ]
      );
    }
  }
};

const insertRecipients = async (
  client: PoolClient,
  campaignId: string,
  recipientIds: string[]
): Promise<void> => {
  for (const contactId of recipientIds) {
    await client.query(
      `INSERT INTO campaign_recipients (id, campaign_id, contact_id, status)
       VALUES ($1, $2, $3, 'pending')`,
      [randomUUID(), campaignId, contactId]
    );
  }
};

export const createCampaignWithRelations = async (
  input: CreateCampaignDbInput
): Promise<CampaignRow> => {
  const client = await pool.connect();
  const campaignId = randomUUID();

  try {
    await client.query("BEGIN");

    const campRes = await client.query(
      `INSERT INTO campaigns (
         id, account_id, name, description, status, audience_scope, scheduled_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${CAMPAIGN_COLUMNS}`,
      [
        campaignId,
        input.accountId,
        input.name,
        input.description,
        input.status,
        input.audienceScope,
        input.scheduledAt,
      ]
    );
    const campaign = campRes.rows[0] as CampaignRow | undefined;
    if (!campaign) {
      throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Campaign insert failed");
    }

    await insertContentsAndButtons(client, campaignId, input.contents);
    await insertRecipients(client, campaignId, input.recipientIds);

    await client.query("COMMIT");
    return campaign;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const softDeleteCampaign = async (
  campaignId: string,
  accountId: string
): Promise<boolean> => {
  const res = await query(
    `UPDATE campaigns SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL`,
    [campaignId, accountId]
  );
  return (res.rowCount ?? 0) > 0;
};

export const deleteCampaignChildren = async (
  client: PoolClient,
  campaignId: string
): Promise<void> => {
  await client.query(
    `DELETE FROM campaign_buttons
     WHERE campaign_content_id IN (
       SELECT id FROM campaign_contents WHERE campaign_id = $1
     )`,
    [campaignId]
  );
  await client.query(`DELETE FROM campaign_contents WHERE campaign_id = $1`, [
    campaignId,
  ]);
  await client.query(`DELETE FROM campaign_recipients WHERE campaign_id = $1`, [
    campaignId,
  ]);
};

export const updateCampaignWithRelations = async (
  campaignId: string,
  accountId: string,
  fields: {
    name?: string;
    description?: string | null;
    status?: string;
    scheduledAt?: Date | null;
    audienceScope?: AudienceScope;
    contents?: CreateCampaignContentInput[];
    recipientIds?: string[];
  }
): Promise<CampaignRow | null> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sets: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [campaignId, accountId];

    if (fields.name !== undefined) {
      params.push(fields.name);
      sets.push(`name = $${params.length}`);
    }
    if (fields.description !== undefined) {
      params.push(fields.description);
      sets.push(`description = $${params.length}`);
    }
    if (fields.status !== undefined) {
      params.push(fields.status);
      sets.push(`status = $${params.length}`);
    }
    if (fields.scheduledAt !== undefined) {
      params.push(fields.scheduledAt);
      sets.push(`scheduled_at = $${params.length}`);
    }
    if (fields.audienceScope !== undefined) {
      params.push(fields.audienceScope);
      sets.push(`audience_scope = $${params.length}`);
    }

    const upd = await client.query(
      `UPDATE campaigns SET ${sets.join(", ")}
       WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL
       RETURNING ${CAMPAIGN_COLUMNS}`,
      params
    );
    const campaign = upd.rows[0] as CampaignRow | undefined;
    if (!campaign) {
      await client.query("ROLLBACK");
      return null;
    }

    if (fields.contents !== undefined) {
      await deleteCampaignChildren(client, campaignId);
      await insertContentsAndButtons(client, campaignId, fields.contents);
    }

    if (fields.recipientIds !== undefined) {
      await client.query(
        `DELETE FROM campaign_recipients WHERE campaign_id = $1`,
        [campaignId]
      );
      await insertRecipients(client, campaignId, fields.recipientIds);
    }

    await client.query("COMMIT");
    return campaign;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
