import { CookieOptions } from "express";
import { AUTH_COOKIE_MAX_AGE_MS } from "./auth";

const prod = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions= {
  httpOnly: true,
  secure: prod,
  sameSite:prod?"lax":"none" ,
  path: "/",
  maxAge:AUTH_COOKIE_MAX_AGE_MS
};
