import { randomUUID } from "crypto";
import { query } from "@/config/db";
import type { ContactRow } from "@/types/campaign";

export type UpsertContactInput = {
  accountId: string;
  instagramUserId: string;
  username: string | null;
  windowExpiresAt: Date;
  notificationToken?: string | null;
  isSubscribed?: boolean;
};

export const findContactByInstagramUser = async (
  accountId: string,
  instagramUserId: string
): Promise<ContactRow | null> => {
  const res = await query(
    `SELECT id, account_id, instagram_user_id, username, is_subscribed,
            window_expires_at, notification_token, created_at
     FROM contacts
     WHERE account_id = $1 AND instagram_user_id = $2
     LIMIT 1`,
    [accountId, instagramUserId]
  );
  return (res.rows[0] as ContactRow | undefined) ?? null;
};

export const upsertContactFromIncomingMessage = async (
  input: UpsertContactInput
): Promise<ContactRow> => {
  const existing = await findContactByInstagramUser(
    input.accountId,
    input.instagramUserId
  );
  
  if (existing) {
    const res = await query(

      `UPDATE contacts SET
      
       username =
       COALESCE($2, username),
      
       last_interaction =
       NOW(),
      
       first_interaction =
       COALESCE(
         first_interaction,
         NOW()
       ),
      
       window_expires_at =
       $3,
      
       notification_token =
       COALESCE(
         $4,
         notification_token
       ),
      
       is_subscribed =
       COALESCE(
         $5,
         is_subscribed
       )
      
      WHERE id=$1
      
      RETURNING *`,
      
      [
       existing.id,
      
       input.username,
      
       input.windowExpiresAt,
      
       input.notificationToken ?? null,
      
       input.isSubscribed ?? null
      ]
      
      )
    return res.rows[0] as ContactRow;
  }

  const id = randomUUID();
  const res = await query(
    `INSERT INTO contacts (
       id, account_id, instagram_user_id, username,
       first_interaction, last_interaction, window_expires_at,
       notification_token, is_subscribed
     ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7)
     RETURNING id, account_id, instagram_user_id, username, is_subscribed,
               window_expires_at, notification_token, created_at`,
    [
      id,
      input.accountId,
      input.instagramUserId,
      input.username||"",
      input.windowExpiresAt,
      input.notificationToken ?? null,
      input.isSubscribed ?? false,
    ]
  );
  return res.rows[0] as ContactRow;
};

export const markContactSubscribed = async (
  contactId: string,
  notificationToken?: string | null
): Promise<ContactRow | null> => {
  const res = await query(
    `UPDATE contacts SET
       is_subscribed = true,
       notification_token = COALESCE($2, notification_token),
       last_interaction = NOW()
     WHERE id = $1
     RETURNING id, account_id, instagram_user_id, username, is_subscribed,
               window_expires_at, notification_token, created_at`,
    [contactId, notificationToken ?? null]
  );
  return (res.rows[0] as ContactRow | undefined) ?? null;
};

export const findContactsByIdsForAccount = async (
  accountId: string,
  contactIds: string[]
): Promise<ContactRow[]> => {
  if (contactIds.length === 0) return [];
  const res = await query(
    `SELECT id, account_id, instagram_user_id, username, is_subscribed,
            window_expires_at, notification_token, created_at
     FROM contacts
     WHERE account_id = $1 AND id = ANY($2::uuid[])`,
    [accountId, contactIds]
  );
  return res.rows as ContactRow[];
};

export const findSubscribedContactsForAccount = async (
  accountId: string
): Promise<ContactRow[]> => {
  const res = await query(
    `SELECT id, account_id, instagram_user_id, username, is_subscribed,
            window_expires_at, notification_token, created_at
     FROM contacts
     WHERE account_id = $1
     ORDER BY created_at ASC`,
    [accountId]
  );
  return res.rows as ContactRow[];
};

export const findContactsByCampaignId = async (
  campaignId: string
): Promise<ContactRow[]> => {
  const res = await query(
    `SELECT c.id, c.account_id, c.instagram_user_id, c.username,
            c.is_subscribed, c.window_expires_at, c.notification_token, c.created_at
     FROM contacts c
     INNER JOIN campaign_recipients cr ON cr.contact_id = c.id
     WHERE cr.campaign_id = $1`,
    [campaignId]
  );
  return res.rows as ContactRow[];
};
