import type { InstagramAccountListQuery } from "@/types/instagram";
import { parseLimit, parsePage } from "@/utils/pagination";

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return undefined;
};

export const parseInstagramAccountListQuery = (
  query: Record<string, unknown>
): InstagramAccountListQuery => ({
  page: parsePage(query.page),
  limit: parseLimit(query.limit),
  isActive: parseOptionalBoolean(query.is_active),
});
