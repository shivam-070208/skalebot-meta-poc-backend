import type { Request, Response } from "express";
import { StatusCodes } from "@/config/status-codes.js";
import {
  handleMetaWebhook,
  verifyMetaWebhookChallenge,
} from "@/services/webhook.service.js";
import ApiError from "@/utils/api-error.js";

const META_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "";

export const metaWebhookVerify = async (
  req: Request,
  res: Response
): Promise<void> => {
  const mode = typeof req.query["hub.mode"] === "string" ? req.query["hub.mode"] : undefined;
  const token =
    typeof req.query["hub.verify_token"] === "string"
      ? req.query["hub.verify_token"]
      : undefined;
  const challenge =
    typeof req.query["hub.challenge"] === "string"
      ? req.query["hub.challenge"]
      : undefined;

  const answer = verifyMetaWebhookChallenge(
    mode,
    token,
    challenge,
    META_VERIFY_TOKEN
  );

  if (!answer) {
    throw new ApiError("HTTP_403_FORBIDDEN", "Webhook verification failed");
  }

  res.status(StatusCodes.HTTP_200_OK).send(answer);
};

export const metaWebhookReceive = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(StatusCodes.HTTP_200_OK).json({ received: true });
  void handleMetaWebhook(req.body).catch((err) => {
    console.error("Meta webhook handler error", err);
  });
};
