export const TRIGGER_TYPES = ["message", "comment", "keyword"] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const ACTION_TYPES = ["send_text", "send_campaign"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export type AutomationRuleRow = {
  id: string;
  post_id: string;
  trigger_type: string;
  trigger_value: string;
  action_type: string;
  action_value:string;
  is_active: boolean;
  created_at: Date;
};

export type PublicAutomationRule = {
  id: string;
  postId: string;
  triggerType: string;
  triggerValue: string;
  actionType: string;
  isActive: boolean;
  createdAt: string;
  actionValue:string;
};

export type MatchedAutomationRule = AutomationRuleRow & {
  account_id: string;
  caption: string | null;
  external_media_id:string | null;
};

