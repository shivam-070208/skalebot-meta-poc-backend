export type InstagramShortTokenEnvelope = {
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

export type InstagramLongLivedTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: { message?: string };
};

export type InstagramMePayload = {
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

export type InstagramShortToken = {
  accessToken: string;
  userId: string;
};

export type InstagramLongLivedToken = {
  accessToken: string;
  expiresInSec: number;
};

export type InstagramProfile = {
  igUserId: string;
  username: string | null;
  profilePicture: string | null;
};

export type UpsertInstagramAccountInput = {
  userId: string;
  instagramAccountId: string;
  username: string | null;
  profilePicture: string | null;
  accessToken: string;
  tokenExpiry: Date | null;
};

export type PublicInstagramAccount = {
  id: string;
  instagramAccountId: string;
  username: string | null;
  profilePicture: string | null;
};

export type InstagramOAuthCallbackQuery = {
  oauthCode: string;
  oauthState: string;
};
