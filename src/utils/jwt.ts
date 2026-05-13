import jwt from "jsonwebtoken";
import {
  JWT_EXPIRES_IN_SEC,
  JWT_SECRET,
} from "@/config/auth";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(
    { email: payload.email, role: payload.role },
    JWT_SECRET,
    {
      subject: payload.sub,
      expiresIn: JWT_EXPIRES_IN_SEC,
    }
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
    email?: string;
    role?: string;
  };
  const sub = decoded.sub;
  if (
    typeof sub !== "string" ||
    typeof decoded.email !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }
  return { sub, email: decoded.email, role: decoded.role };
};

