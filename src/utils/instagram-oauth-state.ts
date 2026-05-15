import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config/auth";

const STATE_TYP = "instagram_oauth_v1" as const;

export const createInstagramOAuthState = (userId: string): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ typ: STATE_TYP }, JWT_SECRET, {
    subject: userId,
    expiresIn: "10m",
  });
};

export const verifyInstagramOAuthState = (token: string): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  if (decoded.typ !== STATE_TYP || typeof decoded.sub !== "string") {
    throw new Error("Invalid OAuth state");
  }
  return decoded.sub;
};
