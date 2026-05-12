import { StatusCodes } from "@/config/status-codes";
import { tryCatch } from "@/utils/try-catch";
import { Router, Request, Response } from "express";

const router = Router();


router.get("/", tryCatch(async (req: Request, res: Response) => {
  res.status(StatusCodes.HTTP_200_OK).json({ message: "Test route is working!" + Math.random()});
}));

export default router;