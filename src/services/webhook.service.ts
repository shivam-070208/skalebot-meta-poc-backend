import { findAccountByInstagramId } from "@/repositories/account.repository";
import {
  findKeywordRules,
  findMatchingRules,
} from "@/repositories/automation-rule.repository";
import {
  insertWebhookEvent,
  markWebhookEventProcessed,
} from "@/repositories/webhook-event.repository";
import { handleIncomingMessageContact } from "@/services/contact-webhook.service";
import { queueAutomationActions } from "@/services/automation-execution.service";
import { parseMetaWebhookPayload } from "@/webhooks/meta-parser";
import { matchRulesForEvent } from "@/webhooks/rule-matcher";

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

      if (event.isIncomingMessage) {
        await handleIncomingMessageContact(account.id, event);
      }

     
      let mediaId: string | null = null;
      if (
        event.raw &&
        typeof event.raw === "object" &&
        "value" in event.raw &&
        event.raw.value &&
        typeof event.raw.value === "object" &&
        "media" in event.raw.value &&
        event.raw.value.media &&
        typeof event.raw.value.media === "object" &&
        "id" in event.raw.value.media &&
        typeof event.raw.value.media.id === "string"
      ) {
        mediaId = event.raw.value.media.id;
      }
 
        

      let exactRules = [];
      if (mediaId) {
       
       const  exactRulese = await findMatchingRules(
          account.id,
          event.triggerType,
          event.triggerValue
        );
        exactRules = exactRulese.filter((rule) => rule.external_media_id === mediaId);
      } else {
       
        exactRules = await findMatchingRules(
          account.id,
          event.triggerType,
          event.triggerValue
        );
      }
 
      let keywordRules: any[] = [];
      if (event.triggerType === "message") {
        keywordRules = await findKeywordRules(account.id, event.triggerValue);
       
        if (mediaId) {
          keywordRules = keywordRules.filter((rule: any) => rule.post_id === mediaId);
        }
      }
 

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
