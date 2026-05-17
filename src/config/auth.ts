const sevenDaysSec = 7 * 24 * 60 * 60;

export const JWT_SECRET = process.env.JWT_SECRET ?? "";
export const JWT_EXPIRES_IN_SEC = Number(
  process.env.JWT_EXPIRES_IN_SEC ?? String(sevenDaysSec)
);
export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "access_token";
export const AUTH_COOKIE_MAX_AGE_MS = JWT_EXPIRES_IN_SEC * 1000;


export const AUTH_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const AUTH_BCRYPT_ROUNDS = 10;
export const AUTH_PASSWORD_MIN = 8;
