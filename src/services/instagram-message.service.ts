import axios, { isAxiosError } from "axios";
import { instagramGraphUrl } from "@/config/instagram.js";
import { findAccountById } from "@/repositories/account.repository.js";
import ApiError from "@/utils/api-error.js";

export const sendInstagramMessage = async (params: {
  accountId: string;
  recipientId: string;
  text: string;
}): Promise<void> => {
  const account = await findAccountById(params.accountId);
  if (!account?.access_token) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Instagram account has no access token"
    );
  }

  if (params.recipientId === account.instagram_account_id) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Cannot send a message to the same Instagram account (check webhook sender id)"
    );
  }

  const url = instagramGraphUrl(
    `/${account.instagram_account_id}/messages`
  );

  try {
    await axios.post(
      url,
      {
        recipient: { id: params.recipientId },
        message: { text: params.text },
      },
      { params: { access_token: account.access_token } }
    );
  } catch (err) {
    if (isAxiosError(err)) {
      const meta = err.response?.data as
        | { error?: { message?: string; code?: number } }
        | undefined;
      const detail = meta?.error?.message ?? err.message;
      console.error("Instagram send message failed", {
        status: err.response?.status,
        code: meta?.error?.code,
        message: detail,
        recipientId: params.recipientId,
        igUserId: account.instagram_account_id,
      });
      throw new ApiError(
        "HTTP_502_BAD_GATEWAY",
        `Instagram message failed: ${detail}`
      );
    }
    throw err;
  }
};
