import type { Request, Response } from "express";
import { parseInstagramAccountListQuery } from "@/api/v1/validators/account.validator";
import {
  getInstagramAccountById,
  getInstagramAccounts,
} from "@/services/account.service";
import ApiError from "@/utils/api-error";
import { sendSuccess } from "@/utils/success-response";

const requireUser = (req: Request): string => {
  if (!req.user?.id) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Unauthorized");
  }
  return req.user.id;
};

export const listInstagramAccountsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const query = parseInstagramAccountListQuery(req.query);
  const data = await getInstagramAccounts(userId, query);
  sendSuccess(res, "Instagram accounts fetched", data);
};

export const getInstagramAccountHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Account id is required");
  }
  const data = await getInstagramAccountById(userId, id);
  sendSuccess(res, "Instagram account fetched", data);
};
