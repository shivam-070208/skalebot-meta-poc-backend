import {
  AUTH_EMAIL_RE,
  AUTH_PASSWORD_MIN,
} from "@/config/auth";
import type { LoginInput, RegisterInput } from "@/types/user";
import ApiError from "@/utils/api-error";

const parseBody = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};

export const parseRegisterBody = (body: unknown): RegisterInput => {
  const b = parseBody(body);
  const rawEmail = typeof b.email === "string" ? b.email.trim() : "";
  const email = rawEmail.toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const name =
    typeof b.name === "string" && b.name.trim().length > 0
      ? b.name.trim()
      : null;

  if (!email || !AUTH_EMAIL_RE.test(email)) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Valid email is required");
  }
  if (password.length < AUTH_PASSWORD_MIN) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      `Password must be at least ${AUTH_PASSWORD_MIN} characters`
    );
  }

  return { email, password, name };
};

export const parseLoginBody = (body: unknown): LoginInput => {
  const b = parseBody(body);
  const rawEmail = typeof b.email === "string" ? b.email.trim() : "";
  const email = rawEmail.toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";

  if (!email || !password) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Email and password are required"
    );
  }

  return { email, password };
};
