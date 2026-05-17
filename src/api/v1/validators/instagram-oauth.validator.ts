import type { Request } from "express";
import ApiError from "@/utils/api-error";
import { expectStr } from "@/utils/expect-str";
import {
  verifyInstagramOAuthState,
} from "@/utils/instagram-oauth-state";
import type {
  InstagramOAuthCallbackQuery,
  InstagramShortToken,
  InstagramShortTokenEnvelope,
} from "@/types/instagram";

const readQueryString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const parseInstagramOAuthCallbackQuery = (
  query: Request["query"]
): InstagramOAuthCallbackQuery => {
  const err = readQueryString(query.error);
  if (err === "access_denied") {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Instagram authorization was cancelled"
    );
  }
  if (err) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `Instagram authorization failed: ${err}`
    );
  }

  const codeRaw = readQueryString(query.code);
  const stateRaw = readQueryString(query.state);
  const oauthCode = expectStr(
    (codeRaw?.split("#")[0] ?? codeRaw)?.trim(),
    "Missing code or state"
  );
  const oauthState = expectStr(stateRaw, "Missing code or state");

  return { oauthCode, oauthState };
};

export const resolveUserIdFromOAuthState = (oauthState: string): string => {
  try {
    return verifyInstagramOAuthState(oauthState);
  } catch {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Invalid or expired OAuth state"
    );
  }
};

export const parseInstagramShortToken = (
  body: unknown
): InstagramShortToken => {
  if (!body || typeof body !== "object") {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Invalid token response from Instagram"
    );
  }
  const o = body as InstagramShortTokenEnvelope;
  if (o.error_type || o.error_message) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      typeof o.error_message === "string"
        ? o.error_message
        : "Instagram rejected the authorization code"
    );
  }
  const row =
    (Array.isArray(o.data) && o.data.length > 0 ? o.data[0] : undefined) ?? o;
  const accessToken =
    row && typeof row === "object" && "access_token" in row
      ? (row as { access_token?: string }).access_token
      : o.access_token;
  const userIdRaw =
    row && typeof row === "object" && "user_id" in row
      ? (row as { user_id?: string | number }).user_id
      : o.user_id;
  const token = expectStr(
    accessToken,
    "Invalid token response from Instagram"
  );
  const userId =
    typeof userIdRaw === "number"
      ? String(userIdRaw)
      : typeof userIdRaw === "string"
        ? userIdRaw
        : "";
  const igScopedId = expectStr(
    userId || undefined,
    "Instagram did not return a user id for this token"
  );
  return { accessToken: token, userId: igScopedId };
};
