import type { MatchedAutomationRule } from "@/types/automation.js";
import type { ParsedMetaWebhookEvent } from "@/types/webhook.js";

const ruleKey = (rule: MatchedAutomationRule): string =>
  `${rule.id}:${rule.post_id}`;

export const matchRulesForEvent = (
  exactRules: MatchedAutomationRule[],
  keywordRules: MatchedAutomationRule[],
  event: ParsedMetaWebhookEvent
): MatchedAutomationRule[] => {
  const merged = new Map<string, MatchedAutomationRule>();

  for (const rule of exactRules) {
    if (event.triggerType === "comment" && rule.trigger_type !== "comment") {
      continue;
    }
    if (
      (event.triggerType === "message" || event.triggerType === "keyword") &&
      rule.trigger_type === "comment"
    ) {
      continue;
    }
    merged.set(ruleKey(rule), rule);
  }

  for (const rule of keywordRules) {
    if (rule.trigger_type !== "keyword") continue;
    merged.set(ruleKey(rule), rule);
  }

  return [...merged.values()];
};
