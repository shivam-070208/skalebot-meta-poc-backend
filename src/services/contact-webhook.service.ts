import {
  MESSAGING_WINDOW_HOURS,
  SUBSCRIBE_KEYWORD,
  SUBSCRIBE_NOTIFICATION_OPTIN_MESSAGE,
  SUBSCRIBE_PROMPT_MESSAGE,
  SUBSCRIBE_SUCCESS_MESSAGE,
} from "@/config/contacts";
import { messageQueue } from "@/config/queues";
import {
  markContactSubscribed,
  upsertContactFromIncomingMessage,
} from "@/repositories/contact.repository";
import type { ParsedMetaWebhookEvent } from "@/types/webhook";

const messagingWindowExpiresAt = (): Date =>
  new Date(Date.now() + MESSAGING_WINDOW_HOURS * 60 * 60 * 1000);

const isSubscribeIntent = (event: ParsedMetaWebhookEvent): boolean => {
  const text = event.triggerValue.trim().toLowerCase();
  const postback = (event.postbackPayload ?? "").trim().toLowerCase();
  return (
    text === SUBSCRIBE_KEYWORD ||
    postback === SUBSCRIBE_KEYWORD ||
    postback === "subscribe"
  );
};

const queueOutboundMessage = async (
  accountId: string,
  recipientId: string,
  text: string
): Promise<void> => {
  await messageQueue.add(
    "send-message",
    { accountId, recipientId, text },
    { jobId: `contact-msg-${accountId}-${recipientId}-${Date.now()}` }
  );
};

export const handleIncomingMessageContact = async (
  accountId: string,
  event: ParsedMetaWebhookEvent
): Promise<void> => {
  console.log(event)
  if (!event.isIncomingMessage || event.isEcho || !event.senderId) {
    return;
  }

  const windowExpiresAt = messagingWindowExpiresAt();
  const hasNotificationToken = Boolean(event.notificationToken);
  const subscribeIntent = isSubscribeIntent(event);

  let contact = await upsertContactFromIncomingMessage({
    accountId,
    instagramUserId: event.senderId,
    username: event.username,
    windowExpiresAt,
    notificationToken: event.notificationToken,
    isSubscribed: hasNotificationToken || subscribeIntent ? true : undefined,
  });

  if (hasNotificationToken) {
    contact =
      (await markContactSubscribed(contact.id, event.notificationToken)) ??
      contact;
    await queueOutboundMessage(
      accountId,
      event.senderId,
      SUBSCRIBE_NOTIFICATION_OPTIN_MESSAGE
    );
    return;
  }

  if (subscribeIntent) {
    contact =
      (await markContactSubscribed(contact.id, event.notificationToken)) ??
      contact;
    await queueOutboundMessage(
      accountId,
      event.senderId,
      SUBSCRIBE_SUCCESS_MESSAGE
    );
    return;
  }

  if (!contact.is_subscribed) {
    await queueOutboundMessage(
      accountId,
      event.senderId,
      SUBSCRIBE_PROMPT_MESSAGE
    );
  }
};
