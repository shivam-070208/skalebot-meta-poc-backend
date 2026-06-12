import type { PublicPost, PostRow } from "@/types/post";
import type {
  AutomationRuleRow,
  PublicAutomationRule,
} from "@/types/automation";

export const mapPostRow = (row: PostRow): PublicPost => ({
  id: row.id,
  accountId: row.account_id,
  caption: row.caption,
  mediaUrl: row.media_url,
  scheduledAt: row.scheduled_at?.toISOString() ?? null,
  publishStatus: row.publish_status,
  publishedAt: row.published_at?.toISOString() ?? null,
  createdAt: row.created_at.toISOString(),
});

export const mapAutomationRuleRow = (
  row: AutomationRuleRow
): PublicAutomationRule => ({
  id: row.id,
  postId: row.post_id,
  triggerType: row.trigger_type,
  triggerValue: row.trigger_value,
  actionType: row.action_type,
  isActive: row.is_active,
  createdAt: row.created_at.toISOString(),
  actionValue:row.action_value
});
