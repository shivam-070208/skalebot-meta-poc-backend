import type { Request, Response } from "express";
import {
  parseCampaignListQuery,
  parseCreateCampaignBody,
  parseUpdateCampaignBody,
} from "@/api/v1/validators/campaign.validator";
import {
  createCampaign,
  deleteCampaign,
  getCampaignById,
  getCampaignHistory,
  getCampaignRecipients,
  getCampaigns,
  updateCampaign,
} from "@/services/campaign.service";
import { StatusCodes } from "@/config/status-codes";
import ApiError from "@/utils/api-error";
import { sendSuccess } from "@/utils/success-response";

const requireUser = (req: Request): string => {
  if (!req.user?.id) {
    throw new ApiError("HTTP_401_UNAUTHORIZED", "Unauthorized");
  }
  return req.user.id;
};

export const createCampaignHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const input = parseCreateCampaignBody(req.body);
  const data = await createCampaign(userId, input);
  sendSuccess(res, "Campaign created", data, StatusCodes.HTTP_201_CREATED);
};

export const listCampaignsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const query = parseCampaignListQuery(req.query);
  const data = await getCampaigns(userId, query);
  sendSuccess(res, "Campaigns fetched", data);
};

export const getCampaignHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) throw new ApiError("HTTP_400_BAD_REQUEST", "Campaign id is required");
  const data = await getCampaignById(userId, id);
  sendSuccess(res, "Campaign fetched", data);
};

export const updateCampaignHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) throw new ApiError("HTTP_400_BAD_REQUEST", "Campaign id is required");
  const input = parseUpdateCampaignBody(req.body);
  const data = await updateCampaign(userId, id, input);
  sendSuccess(res, "Campaign updated", data);
};

export const deleteCampaignHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) throw new ApiError("HTTP_400_BAD_REQUEST", "Campaign id is required");
  await deleteCampaign(userId, id);
  sendSuccess(res, "Campaign deleted", { id });
};

export const getCampaignRecipientsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) throw new ApiError("HTTP_400_BAD_REQUEST", "Campaign id is required");
  const data = await getCampaignRecipients(userId, id);
  sendSuccess(res, "Campaign recipients fetched", data);
};

export const getCampaignHistoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUser(req);
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) throw new ApiError("HTTP_400_BAD_REQUEST", "Campaign id is required");
  const data = await getCampaignHistory(userId, id);
  sendSuccess(res, "Campaign history placeholder", data);
};
