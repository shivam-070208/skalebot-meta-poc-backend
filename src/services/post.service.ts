import { publishQueue } from "@/config/queues.js";
import {
  mapAutomationRuleRow,
  mapPostRow,
} from "@/mappers/post.mapper.js";
import { findAccountForUser } from "@/repositories/account.repository.js";
import { findRuleByPostId } from "@/repositories/automation-rule.repository.js";
import {
  createPostWithOptionalRule,
  findPostForUser,
} from "@/repositories/post.repository.js";
import type { PublicAutomationRule } from "@/types/automation.js";
import type { CreatePostInput, CreatePostResult } from "@/types/post.js";
import ApiError from "@/utils/api-error.js";

const computeDelayMs = (scheduledAt: Date): number => {
  const delay = scheduledAt.getTime() - Date.now();
  return delay > 0 ? delay : 0;
};

export const createPost = async (
  input: CreatePostInput
): Promise<CreatePostResult> => {
  const account = await findAccountForUser(input.accountId, input.userId);
  if (!account) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Account not found");
  }

  if (input.publishType === "scheduled") {
    if (!input.scheduledAt) {
      throw new ApiError(
        "HTTP_400_BAD_REQUEST",
        "scheduled_at is required for scheduled posts"
      );
    }
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new ApiError(
        "HTTP_400_BAD_REQUEST",
        "scheduled_at must be in the future"
      );
    }
  }

  const publishStatus =
    input.publishType === "instant" ? "queued" : "scheduled";

  const { post, rule } = await createPostWithOptionalRule(
    {
      accountId: input.accountId,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
      scheduledAt:
        input.publishType === "scheduled" ? input.scheduledAt : null,
      publishStatus,
    },
    input.automationRule
      ? {
          triggerType: input.automationRule.triggerType,
          triggerValue: input.automationRule.triggerValue,
          actionType: input.automationRule.actionType,
        }
      : null
  );

  if (input.publishType === "instant") {
    await publishQueue.add(
      "publish-post",
      { postId: post.id },
      { jobId: `publish-${post.id}` }
    );
  } else if (input.scheduledAt) {
    await publishQueue.add(
      "publish-post",
      { postId: post.id },
      {
        jobId: `publish-${post.id}`,
        delay: computeDelayMs(input.scheduledAt),
      }
    );
  }

  return {
    post: mapPostRow(post),
    automationRule: rule ? mapAutomationRuleRow(rule) : null,
  };
};

export const getAutomationRuleForPost = async (
  postId: string,
  userId: string
): Promise<PublicAutomationRule> => {
  const post = await findPostForUser(postId, userId);
  if (!post) {
    throw new ApiError("HTTP_404_NOT_FOUND", "Post not found");
  }

  const rule = await findRuleByPostId(postId);
  if (!rule) {
    throw new ApiError(
      "HTTP_404_NOT_FOUND",
      "No automation rule for this post"
    );
  }

  return mapAutomationRuleRow(rule);
};
