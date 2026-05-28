import { randomUUID } from "crypto";
import { query } from "@/config/db";
import ApiError from "@/utils/api-error";
import type {
  PublicInstagramAccount,
  UpsertInstagramAccountInput,
} from "@/types/instagram";

type AccountRow = {
  id: string;
  instagram_account_id: string;
  username: string | null;
  profile_picture: string | null;
};

const mapAccountRow = (row: AccountRow): PublicInstagramAccount => ({
  id: row.id,
  instagramAccountId: row.instagram_account_id,
  username: row.username,
  profilePicture: row.profile_picture,
});

export const upsertInstagramAccount = async (
  input: UpsertInstagramAccountInput
): Promise<PublicInstagramAccount> => {
  const existing = await query(
    `SELECT id FROM accounts
     WHERE user_id = $1 AND instagram_account_id = $2
     LIMIT 1`,
    [input.userId, input.instagramAccountId]
  );
  const existingId = existing.rows[0] as { id: string } | undefined;

  if (existingId?.id) {
    const upd = await query(
      `UPDATE accounts SET
         username = $2,
         profile_picture = $3,
         access_token = $4,
         token_expiry = $5,
         is_active = true
       WHERE id = $1
       RETURNING id, instagram_account_id, username, profile_picture`,
      [
        existingId.id,
        input.username,
        input.profilePicture,
        input.accessToken,
        input.tokenExpiry,
      ]
    );
    const row = upd.rows[0] as AccountRow | undefined;
    if (!row) {
      throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Update failed");
    }
    return mapAccountRow(row);
  }

  const id = randomUUID();
  const ins = await query(
    `INSERT INTO accounts (
       id, user_id, instagram_account_id, page_id,
       username, profile_picture, access_token, token_expiry, is_active
     ) VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, true)
     RETURNING id, instagram_account_id, username, profile_picture`,
    [
      id,
      input.userId,
      input.instagramAccountId,
      input.username,
      input.profilePicture,
      input.accessToken,
      input.tokenExpiry,
    ]
  );
  const row = ins.rows[0] as AccountRow | undefined;
  if (!row) {
    throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Insert failed");
  }
  return mapAccountRow(row);
};

type AccountAuthRow = {
  id: string;
  user_id: string;
  instagram_account_id: string;
  access_token: string | null;
};

export const findAccountForUser = async (
  accountId: string,
  userId: string
): Promise<AccountAuthRow | null> => {
  const res = await query(
    `SELECT id, user_id, instagram_account_id, access_token
     FROM accounts
     WHERE id = $1 AND user_id = $2 AND is_active = true
     LIMIT 1`,
    [accountId, userId]
  );
  return (res.rows[0] as AccountAuthRow | undefined) ?? null;
};

export const findAccountById = async (
  accountId: string
): Promise<AccountAuthRow | null> => {
  const res = await query(
    `SELECT id, user_id, instagram_account_id, access_token
     FROM accounts
     WHERE id = $1 AND is_active = true
     LIMIT 1`,
    [accountId]
  );
  return (res.rows[0] as AccountAuthRow | undefined) ?? null;
};

export const findPrimaryAccountForUser = async (
  userId: string
): Promise<AccountAuthRow | null> => {
  const res = await query(
    `SELECT id, user_id, instagram_account_id, access_token
     FROM accounts
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at ASC
     LIMIT 1`,
    [userId]
  );
  return (res.rows[0] as AccountAuthRow | undefined) ?? null;
};

export const findAccountByInstagramId = async (
  instagramAccountId: string
): Promise<AccountAuthRow | null> => {
  const res = await query(
    `SELECT id, user_id, instagram_account_id, access_token
     FROM accounts
     WHERE instagram_account_id = $1 AND is_active = true
     LIMIT 1`,
    [instagramAccountId]
  );
  return (res.rows[0] as AccountAuthRow | undefined) ?? null;
};
