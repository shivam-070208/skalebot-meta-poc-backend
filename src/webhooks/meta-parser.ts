import type { ParsedMetaWebhookEvent } from "@/types/webhook.js";

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const readText = (message: Record<string, unknown> | null): string => {
  if (!message) return "";
  if (typeof message.text === "string") return message.text.trim();
  const textObj = asRecord(message.text);
  if (textObj && typeof textObj.body === "string") return textObj.body.trim();
  return "";
};

const readNotificationToken = (
  messaging: Record<string, unknown>
): string | null => {
  if (typeof messaging.notification_messages_token === "string") {
    return messaging.notification_messages_token.trim() || null;
  }
  const optin = asRecord(messaging.optin);
  if (optin && typeof optin.notification_messages_token === "string") {
    return optin.notification_messages_token.trim() || null;
  }
  return null;
};

const buildIncomingMessageEvent = (
  pageId: string,
  messaging: Record<string, unknown>
): ParsedMetaWebhookEvent | null => {
  const sender = asRecord(messaging.sender);
  const senderId =
    typeof sender?.id === "string" ? sender.id : String(sender?.id ?? "");
  if (!senderId || !pageId) return null;

  const message = asRecord(messaging.message);
  const isEcho = message?.is_echo === true;
  if (isEcho) return null;

  const text = readText(message);
  const notificationToken = readNotificationToken(messaging);
  const postback = asRecord(messaging.postback);
  const postbackPayload =
    typeof postback?.payload === "string" ? postback.payload.trim() : null;

  const username =
    typeof sender?.username === "string" ? sender.username.trim() : null;

  if (!text && !notificationToken && !postbackPayload) return null;

  return {
    instagramAccountId: pageId,
    triggerType: "message",
    triggerValue: text || postbackPayload || "notification_opt_in",
    senderId,
    username,
    notificationToken,
    postbackPayload,
    isEcho: false,
    isIncomingMessage: true,
    raw: messaging,
  };
};

const parseMessagingEvents = (
  entry: Record<string, unknown>
): ParsedMetaWebhookEvent[] => {
  const pageId =
    typeof entry.id === "string"
      ? entry.id
      : typeof entry.id === "number"
        ? String(entry.id)
        : "";

  const events: ParsedMetaWebhookEvent[] = [];

  for (const item of asArray(entry.messaging)) {
    const messaging = asRecord(item);
    if (!messaging) continue;
    const evt = buildIncomingMessageEvent(pageId, messaging);
    if (evt) events.push(evt);
  }

  for (const item of asArray(entry.changes)) {
    const change = asRecord(item);
    if (!change) continue;

    if (change.field === "messages") {
      const value = asRecord(change.value);
      if (!value) continue;
      const evt = buildIncomingMessageEvent(pageId, value);
      if (evt) events.push(evt);
      continue;
    }

    if (change.field !== "comments") continue;

    const value = asRecord(change.value);
    if (!value) continue;

    const text =
      typeof value.text === "string"
        ? value.text.trim()
        : typeof value.message === "string"
          ? value.message.trim()
          : "";

    const from = asRecord(value.from);
    const senderId =
      typeof from?.id === "string" ? from.id : String(from?.id ?? "");

    const media = asRecord(value.media);
    const mediaOwner =
      media && typeof media.owner === "string" ? media.owner : undefined;

    const accountId =
      typeof mediaOwner === "string" ? mediaOwner : pageId;

    if (!text) continue;

    events.push({
      instagramAccountId: accountId,
      triggerType: "comment",
      triggerValue: text,
      senderId,
      username:
        typeof from?.username === "string" ? from.username.trim() : null,
      notificationToken: null,
      postbackPayload: null,
      isEcho: false,
      isIncomingMessage: false,
      raw: item,
    });
  }

  return events;
};

export const parseMetaWebhookPayload = (
  payload: unknown
): ParsedMetaWebhookEvent[] => {
  const root = asRecord(payload);
  if (!root) return [];

  const objectType = typeof root.object === "string" ? root.object : "";
  if (objectType !== "instagram" && objectType !== "page") {
    return [];
  }

  const events: ParsedMetaWebhookEvent[] = [];
  for (const entry of asArray(root.entry)) {
    const entryObj = asRecord(entry);
    if (!entryObj) continue;
    events.push(...parseMessagingEvents(entryObj));
  }

  return events;
};
