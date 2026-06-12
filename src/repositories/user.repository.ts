import { randomUUID } from "crypto";
import { query } from "@/config/db";
import { StatusCodes } from "@/config/status-codes";
import { mapPublicUser } from "@/mappers/user.mapper";
import type { PublicUser, UserRow, UserRowWithPassword } from "@/types/user";
import ApiError from "@/utils/api-error";

export const insertUser = async (input: {
  name: string | null;
  email: string;
  passwordHash: string;
}): Promise<PublicUser> => {
  const id = randomUUID();
  try {
    const ins = await query(
      `INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at`,
      [id, input.name, input.email, input.passwordHash, "user"]
    );
    const row = ins.rows[0] as UserRow | undefined;
    if (!row) {
      throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Registration failed");
    }
    return mapPublicUser(row);
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
};

export const findUserByEmail = async (
  email: string
): Promise<(UserRowWithPassword & { updatePassword?: (passwordHash: string) => Promise<void> }) | null> => {
  const result = await query(
    `SELECT id, name, email, password, role, created_at FROM users WHERE lower(email) = $1 LIMIT 1`,
    [email]
  );
  const row = result.rows[0] as UserRowWithPassword | undefined;
  if (!row) return null;
  return {
    ...row,
    updatePassword: async (passwordHash: string) => {
      await query(
        `UPDATE users SET password = $1 WHERE id = $2`,
        [passwordHash, row.id]
      );
    }
  };
};
