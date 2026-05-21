import {
  INSTAGRAM_ACCESS_TOKEN_URL,
  INSTAGRAM_APP_ID,
  INSTAGRAM_APP_SECRET,
  INSTAGRAM_AUTHORIZE_URL,
  INSTAGRAM_GRAPH_TOKEN_URL,
  instagramGraphUrl,
  INSTAGRAM_OAUTH_SCOPE,
  INSTAGRAM_REDIRECT_URI,
} from "@/config/instagram";
import { parseInstagramShortToken } from "@/api/v1/validators/instagram-oauth.validator";
import type {
  InstagramLongLivedToken,
  InstagramLongLivedTokenResponse,
  InstagramMePayload,
  InstagramProfile,
  InstagramShortToken,
} from "@/types/instagram";
import { expectStr } from "@/utils/expect-str";
import { parseFetchJson } from "@/utils/parse-fetch-json";
import ApiError from "@/utils/api-error";
import { upsertInstagramAccount } from "@/repositories/account.repository";
import { createInstagramOAuthState } from "@/utils/instagram-oauth-state";
import type { PublicInstagramAccount } from "@/types/instagram";

export const subscribeInstagramWebhooks =
async(

 igUserId:string,

 accessToken:string

):Promise<void>=>{

 const u = new URL(instagramGraphUrl(`/${igUserId}/subscribed_apps`));


 u.searchParams.set(

 "subscribed_fields",

 "comments,messages"

 )


 u.searchParams.set(

 "access_token",

 accessToken

 )


 const res =
 await fetch(

  u.toString(),

  {

   method:"POST"

  }

 )


 let body:any={}


 try{

   body =
   await parseFetchJson(
    res
   )

 }
 catch{

   body={

   error:

   "Unable to parse"

   }

 }


 if(!res.ok){

  console.error(

   "Webhook subscribe failed",

   {

    igUserId,

    status:
     res.status,

    body

   }

  )

  throw new ApiError(

  "HTTP_400_BAD_REQUEST",

  body?.error?.message

  ||

  "Subscription failed"

  )

 }


 console.log(

 "Webhook subscribed:",

 JSON.stringify(
  body,
  null,
  2
 )

 )


 if(

  body.success !== true

 ){

  console.warn(

  "Subscription returned unexpected response",

  body

  )

 }

}
export const buildInstagramAuthorizeUrl = (userId: string): string => {
  const state = createInstagramOAuthState(userId);
  const u = new URL(INSTAGRAM_AUTHORIZE_URL);
  u.searchParams.set("client_id", INSTAGRAM_APP_ID);
  u.searchParams.set("redirect_uri", INSTAGRAM_REDIRECT_URI);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", INSTAGRAM_OAUTH_SCOPE.replace(/\s+/g, ""));
  u.searchParams.set("state", state);
  return u.toString();
};

export const exchangeCodeForShortToken = async (
  code: string
): Promise<InstagramShortToken> => {
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
  const body = await parseFetchJson(res);
  if (!res.ok) {
    console.error("Instagram access_token error", res.status, body);
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Could not exchange Instagram authorization code"
    );
  }
  return parseInstagramShortToken(body);
};

export const exchangeShortForLongToken = async (
  shortToken: string
): Promise<InstagramLongLivedToken> => {
  const u = new URL(INSTAGRAM_GRAPH_TOKEN_URL);
  u.searchParams.set("grant_type", "ig_exchange_token");
  u.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
  u.searchParams.set("access_token", shortToken);
  const res = await fetch(u.toString(), { method: "GET" });
  const body = (await parseFetchJson(res)) as InstagramLongLivedTokenResponse;
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

export const fetchInstagramProfile = async (
  accessToken: string
): Promise<InstagramProfile> => {
  const u = new URL(instagramGraphUrl("/me"));
  u.searchParams.set("fields", "id,user_id,username,profile_picture_url");
  u.searchParams.set("access_token", accessToken);
  const res = await fetch(u.toString(), { method: "GET" });
  const body = (await parseFetchJson(res)) as InstagramMePayload;
  if (!res.ok) {
    console.error("Instagram /me error", res.status, body);
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Could not load Instagram profile"
    );
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
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Could not resolve Instagram user id from profile"
    );
  }

  try {
    await subscribeInstagramWebhooks(String(igUserId), accessToken);
  } catch (e) {
    console.error("Error subscribing to Instagram webhooks", e);
  }

  return {
    igUserId: String(igUserId),
    username: typeof username === "string" ? username : null,
    profilePicture:
      typeof profilePicture === "string" ? profilePicture : null,
  };
};

export const connectInstagramAccount = async (
  userId: string,
  oauthCode: string
): Promise<PublicInstagramAccount> => {
  const short = await exchangeCodeForShortToken(oauthCode);
  const longTok = await exchangeShortForLongToken(short.accessToken);
  const profile = await fetchInstagramProfile(longTok.accessToken);
  const instagramAccountId = profile.igUserId || short.userId;
  const tokenExpiry =
    longTok.expiresInSec > 0
      ? new Date(Date.now() + longTok.expiresInSec * 1000)
      : null;

  return upsertInstagramAccount({
    userId,
    instagramAccountId,
    username: profile.username,
    profilePicture: profile.profilePicture,
    accessToken: longTok.accessToken,
    tokenExpiry,
  });
};
