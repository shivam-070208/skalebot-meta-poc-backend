import { automationQueue, messageQueue } from "@/config/queues.js";
import type { MatchedAutomationRule } from "@/types/automation.js";
import type { ActionType } from "@/types/automation.js";

export const queueAutomationActions = async (
  rules: MatchedAutomationRule[],
  recipientId: string
): Promise<void> => {
  for (const rule of rules) {
    await automationQueue.add(
      "run-automation",
      {
        ruleId: rule.id,
        postId: rule.post_id,
        accountId: rule.account_id,
        recipientId,
        actionType: rule.action_type as ActionType,
      },
      { jobId: `automation-${rule.id}-${recipientId}-${Date.now()}` }
    );
  }
};

export const executeAutomationAction = async (params: {
  actionType: ActionType;
  accountId: string;
  recipientId: string;
  caption: string | null;
  mediaUrl: string | null;
}): Promise<void> => {
  if (params.actionType === "send_post") {
    const parts = [
      params.caption?.trim(),
      params.mediaUrl ? `Media: ${params.mediaUrl}` : null,
    ].filter(Boolean);
    const text = parts.length > 0 ? parts.join("\n\n") : "Here is your content.";
    await messageQueue.add("send-message", {
      accountId: params.accountId,
      recipientId: params.recipientId,
      text,
    });
    return;
  }

  if (params.actionType === "send_campaign") {
    await messageQueue.add("send-message", {
      accountId: params.accountId,
      recipientId: params.recipientId,
      text: "Campaign message (configure campaign delivery in a later iteration).",
    });
  }
};
