import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import {
  INSTAGRAM_APP_ID,
  INSTAGRAM_APP_SECRET,
  INSTAGRAM_GRAPH_API_VERSION,
  INSTAGRAM_OAUTH_SCOPE,
  INSTAGRAM_REDIRECT_URI,
  instagramOAuthConfigured,
} from "@/config/instagram";
import { query } from "@/config/db";
import { StatusCodes } from "@/config/status-codes";
import ApiError from "@/utils/api-error";
import {
  createInstagramOAuthState,
  verifyInstagramOAuthState,
} from "@/utils/instagram-oauth-state";

const INSTAGRAM_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const INSTAGRAM_ACCESS_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_GRAPH_TOKEN_URL = "https://graph.instagram.com/access_token";

const expectStr = (value: string | undefined, message: string): string => {
  if (typeof value !== "string" || !value) {
    throw new ApiError("HTTP_400_BAD_REQUEST", message);
  }
  return value;
};

const readQueryString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

type ShortTokenEnvelope = {
  data?: Array<{
    access_token?: string;
    user_id?: string | number;
    permissions?: string | string[];
  }>;
  access_token?: string;
  user_id?: string | number;
  error_type?: string;
  error_message?: string;
  code?: number;
};

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

const parseJson = async (fetchRes: FetchResponse): Promise<unknown> => {
  const text = await fetchRes.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const extractShortToken = (body: unknown): { accessToken: string; userId: string } => {
  if (!body || typeof body !== "object") {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Invalid token response from Instagram");
  }
  const o = body as ShortTokenEnvelope;
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

const exchangeCodeForShortToken = async (
  code: string
): Promise<{ accessToken: string; userId: string }> => {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    client_secret: INSTAGRAM_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    code,
  });
  const res = await fetch(INSTAGRAM_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    console.error("Instagram access_token error", res.status, body);
    throw new ApiError("HTTP_400_BAD_REQUEST", "Could not exchange Instagram authorization code");
  }
  return extractShortToken(body);
};

const exchangeShortForLongToken = async (
  shortToken: string
): Promise<{ accessToken: string; expiresInSec: number }> => {
  const u = new URL(INSTAGRAM_GRAPH_TOKEN_URL);
  u.searchParams.set("grant_type", "ig_exchange_token");
  u.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
  u.searchParams.set("access_token", shortToken);
  const res = await fetch(u.toString(), { method: "GET" });
  const body = (await parseJson(res)) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || typeof body.access_token !== "string") {
    console.error("Instagram long-lived token error", res.status, body);
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      body.error?.message ?? "Could not obtain long-lived Instagram token"
    );
  }
  const longLived = expectStr(
    body.access_token,
    "Could not obtain long-lived Instagram token"
  );
  const expiresInSec =
    typeof body.expires_in === "number" && body.expires_in > 0
      ? body.expires_in
      : 0;
  return { accessToken: longLived, expiresInSec };
};

type MePayload = {
  id?: string;
  username?: string;
  user_id?: string;
  profile_picture_url?: string;
  data?: Array<{
    user_id?: string;
    username?: string;
    profile_picture_url?: string;
  }>;
};

const fetchInstagramProfile = async (
  accessToken: string
): Promise<{ igUserId: string; username: string | null; profilePicture: string | null }> => {
  const u = new URL(
    `https://graph.instagram.com/${INSTAGRAM_GRAPH_API_VERSION}/me`
  );
  u.searchParams.set(
    "fields",
    "id,user_id,username,profile_picture_url"
  );
  u.searchParams.set("access_token", accessToken);
  const res = await fetch(u.toString(), { method: "GET" });
  const body = (await parseJson(res)) as MePayload;
  if (!res.ok) {
    console.error("Instagram /me error", res.status, body);
    throw new ApiError("HTTP_400_BAD_REQUEST", "Could not load Instagram profile");
  }
  const row =
    (Array.isArray(body.data) && body.data.length > 0
      ? body.data[0]
      : undefined) ?? body;
  const igUserId =
    (row && typeof row === "object" && "user_id" in row
      ? (row as { user_id?: string }).user_id
      : undefined) ??
    body.user_id ??
    body.id ??
    (row && typeof row === "object" && "id" in row
      ? (row as { id?: string }).id
      : undefined);
  const username =
    (row && typeof row === "object" && "username" in row
      ? (row as { username?: string }).username
      : undefined) ?? body.username;
  const profilePicture =
    (row && typeof row === "object" && "profile_picture_url" in row
      ? (row as { profile_picture_url?: string }).profile_picture_url
      : undefined) ?? body.profile_picture_url;
  if (!igUserId) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Could not resolve Instagram user id from profile");
  }
  return {
    igUserId: String(igUserId),
    username: typeof username === "string" ? username : null,
    profilePicture:
      typeof profilePicture === "string" ? profilePicture : null,
  };
};

const upsertAccount = async (input: {
  userId: string;
  instagramAccountId: string;
  username: string | null;
  profilePicture: string | null;
  accessToken: string;
  tokenExpiry: Date | null;
}): Promise<{
  id: string;
  instagramAccountId: string;
  username: string | null;
  profilePicture: string | null;
}> => {
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
    const row = upd.rows[0] as
      | {
          id: string;
          instagram_account_id: string;
          username: string | null;
          profile_picture: string | null;
        }
      | undefined;
    if (!row) {
      throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Update failed");
    }
    return {
      id: row.id,
      instagramAccountId: row.instagram_account_id,
      username: row.username,
      profilePicture: row.profile_picture,
    };
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
  const row = ins.rows[0] as
    | {
        id: string;
        instagram_account_id: string;
        username: string | null;
        profile_picture: string | null;
      }
    | undefined;
  if (!row) {
    throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Insert failed");
  }
  return {
    id: row.id,
    instagramAccountId: row.instagram_account_id,
    username: row.username,
    profilePicture: row.profile_picture,
  };
};

export const instagramOAuthStart = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Unauthorized");
  }
  if (!instagramOAuthConfigured()) {
    throw new ApiError(
      "HTTP_503_SERVICE_UNAVAILABLE",
      "Instagram OAuth is not configured on the server"
    );
  }
  const state = createInstagramOAuthState(req.user.id);
  const u = new URL(INSTAGRAM_AUTHORIZE_URL);
  u.searchParams.set("client_id", INSTAGRAM_APP_ID);
  u.searchParams.set("redirect_uri", INSTAGRAM_REDIRECT_URI);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", INSTAGRAM_OAUTH_SCOPE.replace(/\s+/g, ""));
  u.searchParams.set("state", state);
  res.redirect(StatusCodes.HTTP_302_FOUND, u.toString());
};

export const instagramOAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!instagramOAuthConfigured()) {
    throw new ApiError(
      "HTTP_503_SERVICE_UNAVAILABLE",
      "Instagram OAuth is not configured on the server"
    );
  }

  const err = readQueryString(req.query.error);
  if (err === "access_denied") {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Instagram authorization was cancelled");
  }
  if (err) {
    throw new ApiError("HTTP_400_BAD_REQUEST", `Instagram authorization failed: ${err}`);
  }

  const codeRaw = readQueryString(req.query.code);
  const stateRaw = readQueryString(req.query.state);
  const oauthCode = expectStr(
    (codeRaw?.split("#")[0] ?? codeRaw)?.trim(),
    "Missing code or state"
  );
  const oauthState = expectStr(stateRaw, "Missing code or state");

  const userId = (() => {
    try {
      return verifyInstagramOAuthState(oauthState);
    } catch {
      throw new ApiError(
        "HTTP_400_BAD_REQUEST",
        "Invalid or expired OAuth state"
      );
    }
  })();

  const short = await exchangeCodeForShortToken(oauthCode);
  const longTok = await exchangeShortForLongToken(short.accessToken);

  const profile = await fetchInstagramProfile(longTok.accessToken);
  const instagramAccountId = profile.igUserId || short.userId;

  const tokenExpiry =
    longTok.expiresInSec > 0
      ? new Date(Date.now() + longTok.expiresInSec * 1000)
      : null;

  const account = await upsertAccount({
    userId,
    instagramAccountId,
    username: profile.username,
    profilePicture: profile.profilePicture,
    accessToken: longTok.accessToken,
    tokenExpiry,
  });

  res.status(StatusCodes.HTTP_200_OK).json({
    message: "Instagram account connected",
    account: {
      id: account.id,
      instagramAccountId: account.instagramAccountId,
      username: account.username,
      profilePicture: account.profilePicture,
    },
  });
};
