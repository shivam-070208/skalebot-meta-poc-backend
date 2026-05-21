import axios from "axios";
import { instagramGraphUrl } from "@/config/instagram.js";
import { findAccountById } from "@/repositories/account.repository.js";
import { findPostById } from "@/repositories/post.repository.js";
import ApiError from "@/utils/api-error.js";

type PublishPostParams = {
  postId: string;
  accountId: string;
};

export const publishPostToInstagram = async ({
  postId,
  accountId,
}: PublishPostParams): Promise<{ externalMediaId?: string }> => {
  const post = await findPostById(postId);
  if (!post || post.account_id !== accountId) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Post not found");
  }
  if (!post.media_url) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Post has no media_url");
  }

  const account = await findAccountById(accountId);
  if (!account?.access_token) {
    throw new ApiError(
      "HTTP_400_BAD_REQUEST",
      "Instagram account has no access token"
    );
  }

  const containerRes = await axios.post<{ id?: string }>(
    instagramGraphUrl(`/${account.instagram_account_id}/media`),
    null,
    {
      params: {
        image_url: post.media_url,
        caption: post.caption ?? "",
        access_token: account.access_token,
      },
    }
  );

  const creationId = containerRes.data?.id;
  if (!creationId) {
    throw new ApiError(
      "HTTP_502_BAD_GATEWAY",
      "Instagram media container creation failed"
    );
  }

  const publishRes = await axios.post<{ id?: string }>(
    instagramGraphUrl(`/${account.instagram_account_id}/media_publish`),
    null,
    {
      params: {
        creation_id: creationId,
        access_token: account.access_token,
      },
    }
  );

  return { externalMediaId: publishRes.data?.id };
};
