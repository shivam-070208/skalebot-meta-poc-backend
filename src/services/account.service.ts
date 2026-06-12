import {
  countAccountsForUser,
  findPublicAccountForUser,
  listAccountsForUser,
} from "@/repositories/account.repository";
import type {
  InstagramAccountDetail,
  InstagramAccountListItem,
  InstagramAccountListQuery,
} from "@/types/instagram";
import type { PaginationResponse } from "@/types/campaign";
import ApiError from "@/utils/api-error";
import { paginationMeta } from "@/utils/pagination";

const toListItem = (row: {
  id: string;
  instagramAccountId: string;
  username: string | null;
  profilePicture: string | null;
  pageId: string | null;
  isActive: boolean;
  createdAt: string;
}): InstagramAccountListItem => ({
  id: row.id,
  instagramAccountId: row.instagramAccountId,
  username: row.username,
  profilePicture: row.profilePicture,
  pageId: row.pageId,
  isActive: row.isActive,
  createdAt: row.createdAt,
});

const toDetail = (row: {
  id: string;
  instagramAccountId: string;
  username: string | null;
  profilePicture: string | null;
  pageId: string | null;
  isActive: boolean;
  tokenExpiry: string | null;
  createdAt: string;
}): InstagramAccountDetail => ({
  ...toListItem(row),
  tokenExpiry: row.tokenExpiry,
});

export const getInstagramAccounts = async (
  userId: string,
  query: InstagramAccountListQuery
): Promise<PaginationResponse<InstagramAccountListItem>> => {
  const total = await countAccountsForUser(userId, query);
  const rows = await listAccountsForUser(userId, query);

  return {
    items: rows.map(toListItem),
    pagination: paginationMeta(query.page, query.limit, total),
  };
};

export const getInstagramAccountById = async (
  userId: string,
  accountId: string
): Promise<InstagramAccountDetail> => {
  const account = await findPublicAccountForUser(accountId, userId);
  if (!account) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Instagram account not found");
  }
  return toDetail(account);
};
