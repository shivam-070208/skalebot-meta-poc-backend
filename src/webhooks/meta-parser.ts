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

    const sender = asRecord(messaging.sender);
    const senderId =
      typeof sender?.id === "string" ? sender.id : String(sender?.id ?? "");

    const message = asRecord(messaging.message);
    const text = readText(message);
    if (!text || !pageId) continue;

    events.push({
      instagramAccountId: pageId,
      triggerType: "message",
      triggerValue: text,
      senderId,
      raw: item,
    });
  }

  for (const item of asArray(entry.changes)) {
    const change = asRecord(item);
    if (!change || change.field !== "comments") continue;

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
      typeof mediaOwner === "string"
        ? mediaOwner
        : typeof value.media_id === "string"
          ? pageId
          : pageId;

    if (!text) continue;

    events.push({
      instagramAccountId:
        typeof accountId === "string" ? accountId : pageId,
      triggerType: "comment",
      triggerValue: text,
      senderId,
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
