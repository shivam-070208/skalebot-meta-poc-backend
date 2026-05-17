import type { Request, Response } from "express";
import { instagramOAuthConfigured } from "@/config/instagram";
import { StatusCodes } from "@/config/status-codes";
import {
  parseInstagramOAuthCallbackQuery,
  resolveUserIdFromOAuthState,
} from "@/api/v1/validators/instagram-oauth.validator";
import {
  buildInstagramAuthorizeUrl,
  connectInstagramAccount,
} from "@/services/instagram-oauth.service";
import ApiError from "@/utils/api-error";

export const instagramOAuthStart = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Unauthorized");
  }
  if (!instagramOAuthConfigured()) {
    throw new ApiError(
      "HTTP_503_SERVICE_UNAVAILABLE",
      "Instagram OAuth is not configured on the server"
    );
  }
  const authorizeUrl = buildInstagramAuthorizeUrl(req.user.id);
  res.redirect(StatusCodes.HTTP_302_FOUND, authorizeUrl);
};

export const instagramOAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!instagramOAuthConfigured()) {
    throw new ApiError(
      "HTTP_503_SERVICE_UNAVAILABLE",
      "Instagram OAuth is not configured on the server"
    );
  }

  const { oauthCode, oauthState } = parseInstagramOAuthCallbackQuery(
    req.query
  );
  const userId = resolveUserIdFromOAuthState(oauthState);
  const account = await connectInstagramAccount(userId, oauthCode);

  res.status(StatusCodes.HTTP_200_OK).json({
    message: "Instagram account connected",
    account,
  });
};
