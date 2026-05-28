import { Request, Response, NextFunction } from "express"
import ApiError from "./api-error"
import { StatusCodes } from "@/config/status-codes";

export function tryCatch(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await handler(req, res, next)
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          message: err.message,
          cause: err.errors,
        })
      } else {
        return res.status(StatusCodes.HTTP_500_INTERNAL_SERVER_ERROR).json({
          message: "Internal Server Error",
        })
      }
    }
  }
}