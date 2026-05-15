export const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID ?? "";
export const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET ?? "";
export const INSTAGRAM_APP_NAME = process.env.INSTAGRAM_APP_NAME ?? "";
export const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ?? "";
export const INSTAGRAM_OAUTH_SCOPE =
  process.env.INSTAGRAM_OAUTH_SCOPE ?? "instagram_business_basic";
export const INSTAGRAM_GRAPH_API_VERSION =
  process.env.INSTAGRAM_GRAPH_API_VERSION ?? "v21.0";

export const instagramOAuthConfigured = (): boolean =>
  Boolean(INSTAGRAM_APP_ID && INSTAGRAM_APP_SECRET && INSTAGRAM_REDIRECT_URI);
