import { Router } from "express";
import * as webhookController from "@/api/v1/controllers/webhook.controller";
import { tryCatch } from "@/utils/try-catch";

const router = Router();

router.get("/meta", tryCatch(webhookController.metaWebhookVerify));
router.post("/meta", tryCatch(webhookController.metaWebhookReceive));

export default router;
