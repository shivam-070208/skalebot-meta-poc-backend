import type { Request, Response } from "express";
import { parseCreatePostBody } from "@/api/v1/validators/post.validator.js";
import { StatusCodes } from "@/config/status-codes.js";
import {
  createPost,
  getAutomationRuleForPost,
} from "@/services/post.service.js";
import ApiError from "@/utils/api-error.js";

export const createPostHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Unauthorized");
  }
  const input = parseCreatePostBody(req.body, req.user.id);
  const result = await createPost(input);
  res.status(StatusCodes.HTTP_201_CREATED).json(result);
};

export const getPostAutomationRuleHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Unauthorized");
  }
  const postId = typeof req.params.id === "string" ? req.params.id : "";
  if (!postId) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Post id is required");
  }
  const rule = await getAutomationRuleForPost(postId, req.user.id);
  res.status(StatusCodes.HTTP_200_OK).json({ automationRule: rule });
};
