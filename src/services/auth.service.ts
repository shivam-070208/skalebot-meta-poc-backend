import bcrypt from "bcrypt";
import { AUTH_BCRYPT_ROUNDS } from "@/config/auth";
import { mapPublicUser } from "@/mappers/user.mapper";
import {
  findUserByEmail,
  insertUser,
} from "@/repositories/user.repository";
import type { AuthSession, LoginInput, RegisterInput } from "@/types/user";
import ApiError from "@/utils/api-error";
import { signAccessToken } from "@/utils/jwt";
import crypto from "crypto";

const createSession = (user: {
  id: string;
  email: string;
  role: string;
  name: string | null;
  createdAt?: Date;
}): AuthSession => {
  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.createdAt != null && { createdAt: user.createdAt }),
    },
    token,
  };
};

export const registerUser = async (
  input: RegisterInput
): Promise<AuthSession> => {
  const passwordHash = await bcrypt.hash(input.password, AUTH_BCRYPT_ROUNDS);
  const user = await insertUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });
  return createSession(user);
};

export const loginUser = async (input: LoginInput): Promise<AuthSession> => {
  const row = await findUserByEmail(input.email);

  if (!row?.password) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Invalid credentials");
  }

  const ok = await bcrypt.compare(input.password, row.password);
  if (!ok) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Invalid credentials");
  }

  const role = row.role ?? "user";
  return createSession(mapPublicUser({ ...row, role }));
};

const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

const passwordResetTokens: Record<
  string,
  { email: string; expiresAt: number }
> = {};

export const forgotPassword = async (email: string): Promise<{ resetToken: string }> => {
  const user = await findUserByEmail(email);

  if (!user) {
    return { resetToken: "" };
  }

  const resetToken = generatePasswordResetToken();
  const expiresAt = Date.now() + 1000 * 60 * 15;

  passwordResetTokens[resetToken] = { email, expiresAt };

  return { resetToken };
};

export const resetPassword = async (resetToken: string, newPassword: string): Promise<void> => {
  const entry = passwordResetTokens[resetToken];
  if (!entry || entry.expiresAt < Date.now()) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Invalid or expired reset token");
  }

  const { email } = entry;
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError("HTTP_404_NOT_FOUND", "User not found");
  }

  const newPasswordHash = await bcrypt.hash(newPassword, AUTH_BCRYPT_ROUNDS);

  if (typeof user.id === "undefined") {
    throw new ApiError("HTTP_404_NOT_FOUND", "User not found");
  }
  if (typeof user.updatePassword === "function") {
    await user.updatePassword(newPasswordHash);
  } else {
    throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Password update not implemented");
  }

  delete passwordResetTokens[resetToken];
};