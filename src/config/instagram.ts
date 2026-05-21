export const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID ?? "";
export const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET ?? "";
export const INSTAGRAM_APP_NAME = process.env.INSTAGRAM_APP_NAME ?? "";
export const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ?? "";
export const INSTAGRAM_OAUTH_SCOPE =
  process.env.INSTAGRAM_OAUTH_SCOPE ?? "business_basic";
export const INSTAGRAM_GRAPH_API_VERSION =
  process.env.INSTAGRAM_GRAPH_API_VERSION ?? "v25.0";

/** e.g. v25.0 — avoids double "v" in URLs when env already includes it */
export const INSTAGRAM_GRAPH_API_PATH = INSTAGRAM_GRAPH_API_VERSION.startsWith(
  "v"
)
  ? INSTAGRAM_GRAPH_API_VERSION
  : `v${INSTAGRAM_GRAPH_API_VERSION}`;

export const INSTAGRAM_GRAPH_API_BASE = `https://graph.instagram.com/${INSTAGRAM_GRAPH_API_PATH}`;

export const instagramGraphUrl = (path: string): string =>
  `${INSTAGRAM_GRAPH_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

export const INSTAGRAM_AUTHORIZE_URL =
  "https://www.instagram.com/oauth/authorize";
export const INSTAGRAM_ACCESS_TOKEN_URL =
  "https://api.instagram.com/oauth/access_token";
export const INSTAGRAM_GRAPH_TOKEN_URL =
  "https://graph.instagram.com/access_token";

export const instagramOAuthConfigured = (): boolean =>
  Boolean(INSTAGRAM_APP_ID && INSTAGRAM_APP_SECRET && INSTAGRAM_REDIRECT_URI);
