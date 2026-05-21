import { findAccountByInstagramId } from "@/repositories/account.repository.js";
import {
  findKeywordRules,
  findMatchingRules,
} from "@/repositories/automation-rule.repository.js";
import {
  insertWebhookEvent,
  markWebhookEventProcessed,
} from "@/repositories/webhook-event.repository.js";
import { queueAutomationActions } from "@/services/automation-execution.service.js";
import { parseMetaWebhookPayload } from "@/webhooks/meta-parser.js";
import { matchRulesForEvent } from "@/webhooks/rule-matcher.js";

export const handleMetaWebhook = async (payload: unknown): Promise<void> => {
  const events = parseMetaWebhookPayload(payload);
  for (const event of events) {
    const eventId = await insertWebhookEvent(event.triggerType, event.raw);

    try {
      const account = await findAccountByInstagramId(event.instagramAccountId);
      if (!account) {
        await markWebhookEventProcessed(eventId);
        continue;
      }

      const exactRules = await findMatchingRules(
        account.id,
        event.triggerType,
        event.triggerValue
      );

      const keywordRules =
        event.triggerType === "message"
          ? await findKeywordRules(account.id, event.triggerValue)
          : [];

      const rules = matchRulesForEvent(exactRules, keywordRules, event);
      if (rules.length > 0) {
        await queueAutomationActions(rules, event.senderId);
      }

      await markWebhookEventProcessed(eventId);
    } catch (err) {
      console.error("Webhook event processing failed", eventId, err);
    }
  }
};

export const verifyMetaWebhookChallenge = (
  mode: string | undefined,
  token: string | undefined,
  challenge: string | undefined,
  verifyToken: string
): string | null => {
  if (mode === "subscribe" && (token === verifyToken) && challenge) {
    return challenge;
  }
  return null;
};
