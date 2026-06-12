import { query } from "@/config/db";
import type {
  AutomationRuleRow,
  MatchedAutomationRule,
} from "@/types/automation";

export const findRuleByPostId = async (
  postId: string
): Promise<AutomationRuleRow | null> => {
  const res = await query(
    `SELECT id, post_id, trigger_type, trigger_value, action_type,
            is_active, created_at
     FROM automation_rules
     WHERE post_id = $1
     LIMIT 1`,
    [postId]
  );
  return (res.rows[0] as AutomationRuleRow | undefined) ?? null;
};

export const findMatchingRules = async (
  accountId: string,
  triggerType: string,
  triggerValue: string
): Promise<MatchedAutomationRule[]> => {
  const res = await query(
    `SELECT ar.id, ar.post_id, ar.trigger_type, ar.trigger_value,
            ar.action_type, ar.action_value,ar.is_active, ar.created_at,
            p.account_id , p.external_media_id
     FROM automation_rules ar
     INNER JOIN posts p ON p.id = ar.post_id
     WHERE p.account_id = $1
       AND ar.trigger_type = $2
       AND LOWER(TRIM(ar.trigger_value)) = LOWER(TRIM($3))`,
    [accountId, triggerType, triggerValue]
  );
  return res.rows as MatchedAutomationRule[];
};

export const findKeywordRules = async (
  accountId: string,
  messageText: string
): Promise<MatchedAutomationRule[]> => {
  const res = await query(
    `SELECT ar.id, ar.post_id, ar.trigger_type, ar.trigger_value,
            ar.action_type, ar.is_active, ar.created_at,
            p.account_id, p.caption, p.media_url
     FROM automation_rules ar
     INNER JOIN posts p ON p.id = ar.post_id
     WHERE p.account_id = $1
       AND ar.is_active = true
       AND ar.trigger_type = 'keyword'
       AND POSITION(
         LOWER(TRIM(ar.trigger_value)) IN LOWER(TRIM($2))
       ) > 0`,
    [accountId, messageText]
  );
  return res.rows as MatchedAutomationRule[];
};
