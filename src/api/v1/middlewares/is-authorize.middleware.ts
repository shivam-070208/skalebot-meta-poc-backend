import { StatusCodes } from "@/config/status-codes";
import { query } from "@/config/db";
import { AUTH_COOKIE_NAME } from "@/config/auth";
import { verifyAccessToken } from "@/utils/jwt";
import type { Request, Response, NextFunction } from "express";

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header || typeof header !== "string") return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1] ?? null;
};

export const isAuthorize = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fromHeader = extractBearerToken(req.headers.authorization);
    const fromCookie =
      typeof req.cookies?.[AUTH_COOKIE_NAME] === "string"
        ? req.cookies[AUTH_COOKIE_NAME]
        : null;
    const token = fromHeader ?? fromCookie;
    if (!token) {
      res.status(StatusCodes.HTTP_401_UNAUTHORIZED).json({
        message: "Authentication required",
      });
      return;
    }
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(StatusCodes.HTTP_401_UNAUTHORIZED).json({
        message: "Invalid or expired token",
      });
      return;
    }
    const result = await query(
      `SELECT id, email, name, role FROM users WHERE id = $1 LIMIT 1`,
      [payload.sub]
    );
    const row = result.rows[0] as
      | {
          id: string;
          email: string;
          name: string | null;
          role: string;
        }
      | undefined;
    if (!row) {
      res.status(StatusCodes.HTTP_401_UNAUTHORIZED).json({
        message: "User no longer exists",
      });
      return;
    }
    if (row.email !== payload.email) {
      res.status(StatusCodes.HTTP_401_UNAUTHORIZED).json({
        message: "Token no longer valid",
      });
      return;
    }
    req.user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    };
    next();
  } catch {
    res.status(StatusCodes.HTTP_500_INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};
