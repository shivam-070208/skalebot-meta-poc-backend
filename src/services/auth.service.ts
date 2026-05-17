import bcrypt from "bcrypt";
import { AUTH_BCRYPT_ROUNDS } from "@/config/auth-credentials";
import { mapPublicUser } from "@/mappers/user.mapper";
import {
  findUserByEmail,
  insertUser,
} from "@/repositories/user.repository";
import type { AuthSession, LoginInput, RegisterInput } from "@/types/user";
import ApiError from "@/utils/api-error";
import { signAccessToken } from "@/utils/jwt";

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
