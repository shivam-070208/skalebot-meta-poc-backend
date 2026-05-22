import type { Response } from "express";
import { StatusCodes } from "@/config/status-codes";

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = StatusCodes.HTTP_200_OK
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = StatusCodes.HTTP_400_BAD_REQUEST
): void => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};
