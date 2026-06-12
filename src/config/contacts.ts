export const MESSAGING_WINDOW_HOURS = Number(
  process.env.MESSAGING_WINDOW_HOURS ?? "24"
);

export const SUBSCRIBE_KEYWORD = (
  process.env.SUBSCRIBE_KEYWORD ?? "subscribe"
).trim().toLowerCase();

export const SUBSCRIBE_PROMPT_MESSAGE =
  process.env.SUBSCRIBE_PROMPT_MESSAGE ??
  "Thanks for reaching out! Reply SUBSCRIBE to get updates from us. " +
    "You can also opt in to notification messages in Instagram when prompted — " +
    "that gives us a notification token so we can message you outside the 24-hour window.";

export const SUBSCRIBE_SUCCESS_MESSAGE =
  process.env.SUBSCRIBE_SUCCESS_MESSAGE ??
  "You are subscribed. You will receive our updates and campaigns.";

export const SUBSCRIBE_NOTIFICATION_OPTIN_MESSAGE =
  process.env.SUBSCRIBE_NOTIFICATION_OPTIN_MESSAGE ??
  "You are subscribed via notification messages. Thank you!";
