import { randomUUID } from "crypto";
import { query } from "@/config/db";
import ApiError from "@/utils/api-error";
import type {
  InstagramAccountListQuery,
  PublicInstagramAccount,
  UpsertInstagramAccountInput,
} from "@/types/instagram";
import { sqlOffset } from "@/utils/pagination";

type AccountRow = {
  id: string;
  instagram_account_id: string;
  username: string | null;
  profile_picture: string | null;
};

type PublicAccountRow = AccountRow & {
  page_id: string | null;
  is_active: boolean;
  token_expiry: Date | null;
  created_at: Date;
};

const mapAccountRow = (row: AccountRow): PublicInstagramAccount => ({
  id: row.id,
  instagramAccountId: row.instagram_account_id,
  username: row.username,
  profilePicture: row.profile_picture,
});

const mapPublicAccountRow = (row: PublicAccountRow) => ({
  id: row.id,
  instagramAccountId: row.instagram_account_id,
  username: row.username,
  profilePicture: row.profile_picture,
  pageId: row.page_id,
  isActive: row.is_active,
  tokenExpiry: row.token_expiry ? row.token_expiry.toISOString() : null,
  createdAt: row.created_at.toISOString(),
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

const buildAccountListFilters = (
  userId: string,
  listQuery: InstagramAccountListQuery
): { where: string; params: unknown[] } => {
  const params: unknown[] = [userId];
  let where = "WHERE user_id = $1";

  if (listQuery.isActive !== undefined) {
    params.push(listQuery.isActive);
    where += ` AND is_active = $${params.length}`;
  }

  return { where, params };
};

const publicAccountSelect = `
  id, instagram_account_id, username, profile_picture,
  page_id, is_active, token_expiry, created_at
`;

export const countAccountsForUser = async (
  userId: string,
  listQuery: InstagramAccountListQuery
): Promise<number> => {
  const { where, params } = buildAccountListFilters(userId, listQuery);
  const res = await query(
    `SELECT COUNT(*)::int AS total FROM accounts ${where}`,
    params
  );
  return (res.rows[0] as { total: number }).total;
};

export const listAccountsForUser = async (
  userId: string,
  listQuery: InstagramAccountListQuery
) => {
  const { where, params } = buildAccountListFilters(userId, listQuery);
  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const res = await query(
    `SELECT ${publicAccountSelect}
     FROM accounts
     ${where}
     ORDER BY created_at ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, listQuery.limit, sqlOffset(listQuery.page, listQuery.limit)]
  );
  return (res.rows as PublicAccountRow[]).map(mapPublicAccountRow);
};

export const findPublicAccountForUser = async (
  accountId: string,
  userId: string
) => {
  const res = await query(
    `SELECT ${publicAccountSelect}
     FROM accounts
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [accountId, userId]
  );
  const row = res.rows[0] as PublicAccountRow | undefined;
  return row ? mapPublicAccountRow(row) : null;
};
