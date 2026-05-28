import { Router } from "express";
import * as campaignController from "@/api/v1/controllers/campaign.controller";
import { isAuthorize } from "@v1/middlewares/is-authorize.middleware";
import { tryCatch } from "@/utils/try-catch";

const router = Router();

router.post("/", isAuthorize, tryCatch(campaignController.createCampaignHandler));
router.get("/", isAuthorize, tryCatch(campaignController.listCampaignsHandler));
router.get("/:id", isAuthorize, tryCatch(campaignController.getCampaignHandler));
router.patch(
  "/:id",
  isAuthorize,
  tryCatch(campaignController.updateCampaignHandler)
);
router.delete(
  "/:id",
  isAuthorize,
  tryCatch(campaignController.deleteCampaignHandler)
);
router.get(
  "/:id/recipients",
  isAuthorize,
  tryCatch(campaignController.getCampaignRecipientsHandler)
);
router.get(
  "/:id/history",
  isAuthorize,
  tryCatch(campaignController.getCampaignHistoryHandler)
);

export default router;
