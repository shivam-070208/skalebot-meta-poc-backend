import { automationQueue, campaignQueue, messageQueue } from "@/config/queues";
import { enqueueCampaignSend } from "@/queues/campaign.queue";
import { findCampaignById, findCampaignContents } from "@/repositories/campaign.repository";
import type { ActionType ,MatchedAutomationRule } from "@/types/automation";
import { CampaignContent } from "./instagram-message.service";

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
        actionValue:rule.action_value
      },
      { jobId: `automation-${rule.id}-${recipientId}-${Date.now()}` }
    );
  }
};

export const executeAutomationAction = async (params: {
  actionType: ActionType;
  accountId: string;
  recipientId: string;
  actionValue:string
}): Promise<void> => {
  

  if (params.actionType == "send_text") {
    
    await messageQueue.add("send-message", {
    accountId: params.accountId,
    recipientId: params.recipientId,
    contents: [{
      content_type: "text",
      text_content: params.actionValue
    }]
  }, {
    jobId: `automation-${params.actionType}-${params.accountId}-${params.recipientId}-${Date.now()}`
  });
  }

  else if (params.actionType == "send_campaign") {
    const campaign  = await findCampaignById(params.actionValue, params.accountId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const contents = await findCampaignContents(params.actionValue) as unknown as CampaignContent[];
    if (!contents.length) {
      console.log("No campaign contents");
      return;
    }
    

    await messageQueue.add(
      "send-message",
      {
        accountId: params.accountId,
        recipientId: params.recipientId,
        contents: contents.map((c) => ({
          content_type: c.content_type,
          text_content: c.text_content,
          media_url: c.media_url,
          link_url: c.link_url,
          buttons: c.buttons || [],
        })),
      },
      {
        jobId: `campaign-msg-${params.actionValue}-${params.recipientId}-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  }
};
