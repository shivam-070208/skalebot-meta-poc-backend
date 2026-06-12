import { Router } from "express";
import * as accountController from "@/api/v1/controllers/account.controller";
import { isAuthorize } from "@v1/middlewares/is-authorize.middleware";
import { tryCatch } from "@/utils/try-catch";

const router = Router();

router.get(
  "/",
  isAuthorize,
  tryCatch(accountController.listInstagramAccountsHandler)
);
router.get(
  "/:id",
  isAuthorize,
  tryCatch(accountController.getInstagramAccountHandler)
);

export default router;
