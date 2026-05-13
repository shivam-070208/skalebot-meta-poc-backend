import { Router } from "express";
import * as authController from "@/api/v1/controllers/auth.controller";
import { isAuthorize } from "@v1/middlewares/is-authorize.middleware";
import { tryCatch } from "@/utils/try-catch";

const router = Router();

router.post("/register", tryCatch(authController.register));
router.post("/login", tryCatch(authController.login));
router.post("/logout", tryCatch(authController.logout));
router.get("/me", isAuthorize, tryCatch(authController.me));

export default router;
