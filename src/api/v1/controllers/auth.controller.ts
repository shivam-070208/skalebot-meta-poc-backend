import type { Request, Response } from "express";
import {
  parseLoginBody,
  parseRegisterBody,
} from "@/api/v1/validators/auth.validator";
import { AUTH_COOKIE_NAME } from "@/config/auth";
import { cookieOptions } from "@/config/cookie-option";
import { StatusCodes } from "@/config/status-codes";
import { loginUser, registerUser } from "@/services/auth.service";
import ApiError from "@/utils/api-error";

export const register = async (req: Request, res: Response): Promise<void> => {
  const input = parseRegisterBody(req.body);
  const session = await registerUser(input);
  res.cookie(AUTH_COOKIE_NAME, session.token, cookieOptions);
  res.status(StatusCodes.HTTP_201_CREATED).json(session);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const input = parseLoginBody(req.body);
  const session = await loginUser(input);
  res.cookie(AUTH_COOKIE_NAME, session.token, cookieOptions);
  res.status(StatusCodes.HTTP_200_OK).json(session);
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
