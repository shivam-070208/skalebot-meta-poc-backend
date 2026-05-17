import ApiError from "@/utils/api-error";

export const expectStr = (
  value: string | undefined,
  message: string
): string => {
  if (typeof value !== "string" || !value) {
    throw new ApiError("HTTP_400_BAD_REQUEST", message);
  }
  return value;
};
