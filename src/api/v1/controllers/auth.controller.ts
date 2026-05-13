import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { AUTH_COOKIE_NAME } from "@/config/auth";
import { query } from "@/config/db";
import { StatusCodes } from "@/config/status-codes";
import ApiError from "@/utils/api-error";
import { signAccessToken } from "@/utils/jwt";
import { cookieOptions } from "@/config/cookie-option";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;
const PASSWORD_MIN = 8;

const badRequest = (message: string): never => {
  throw new ApiError("HTTP_400_BAD_REQUEST", message);
};

const mapPublicUser = (row: {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at?: Date | null;
}) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  ...(row.created_at != null && { createdAt: row.created_at }),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const email = rawEmail.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : null;

  if (!email || !EMAIL_RE.test(email)) {
    badRequest("Valid email is required");
  }
  if (password.length < PASSWORD_MIN) {
    badRequest(`Password must be at least ${PASSWORD_MIN} characters`);
  }

  const id = randomUUID();
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let inserted: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    created_at: Date | null;
  };

  try {
    const ins = await query(
      `INSERT INTO users (id, name, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, created_at`,
      [id, name, email, hash, "user"]
    );
    const row = ins.rows[0] as typeof inserted | undefined;
    if (!row) {
      throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Registration failed");
    }
    inserted = row;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === String(StatusCodes.DB_UNIQUE_VIOLATION)
    ) {
      throw new ApiError("HTTP_409_CONFLICT", "Email already registered");
    }
    throw err;
  }

  const token = signAccessToken({
    sub: inserted.id,
    email: inserted.email,
    role: inserted.role,
  });
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);

  res.status(StatusCodes.HTTP_201_CREATED).json({
    user: mapPublicUser(inserted),
    token,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const email = rawEmail.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    badRequest("Email and password are required");
  }

  const result = await query(
    `SELECT id, name, email, password, role, created_at
     FROM users WHERE lower(email) = $1 LIMIT 1`,
    [email]
  );
  const row = result.rows[0] as
    | {
        id: string;
        name: string | null;
        email: string;
        password: string | null;
        role: string;
        created_at: Date | null;
      }
    | undefined;

  if (!row?.password) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Invalid credentials");
  }

  const ok = await bcrypt.compare(password, row.password);
  if (!ok) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Invalid credentials");
  }

  const role = row.role ?? "user";
  const token = signAccessToken({
    sub: row.id,
    email: row.email,
    role,
  });
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);

  res.status(StatusCodes.HTTP_200_OK).json({
    user: mapPublicUser({
      id: row.id,
      name: row.name,
      email: row.email,
      role,
      created_at: row.created_at,
    }),
    token,
  });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
  res.status(StatusCodes.HTTP_200_OK).json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Unauthorized");
  }
  res.status(StatusCodes.HTTP_200_OK).json({ user: req.user });
};
