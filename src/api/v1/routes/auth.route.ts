import { Router } from "express";
import * as authController from "@/api/v1/controllers/auth.controller";
import * as instagramAuthController from "@/api/v1/controllers/instagram-auth.controller";
import { isAuthorize } from "@v1/middlewares/is-authorize.middleware";
import { tryCatch } from "@/utils/try-catch";

const router = Router();

router.post("/register", tryCatch(authController.register));
router.post("/login", tryCatch(authController.login));
router.post("/logout", tryCatch(authController.logout));
router.get("/me", isAuthorize, tryCatch(authController.me));

router.get(
  "/instagram",
  isAuthorize,
  tryCatch(instagramAuthController.instagramOAuthStart)
);
router.get(
  "/instagram/callback",
  tryCatch(instagramAuthController.instagramOAuthCallback)
);

export default router;
