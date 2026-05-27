import { Router } from "express";
import * as postController from "@/api/v1/controllers/post.controller";
import { isAuthorize } from "@v1/middlewares/is-authorize.middleware";
import { tryCatch } from "@/utils/try-catch";

const router = Router();

router.post("/", isAuthorize, tryCatch(postController.createPostHandler));
router.get(
  "/:id/automation-rule",
  isAuthorize,
  tryCatch(postController.getPostAutomationRuleHandler)
);

export default router;
