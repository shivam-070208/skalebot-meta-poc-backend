import { randomUUID } from "crypto";
import { query } from "@/config/db";

export const insertWebhookEvent = async (
  eventType: string,
  payload: unknown
): Promise<string> => {
  const id = randomUUID();
  await query(
    `INSERT INTO webhook_events (id, event_type, payload, processed)
     VALUES ($1, $2, $3::jsonb, false)`,
    [id, eventType, JSON.stringify(payload)]
  );
  return id;
};

export const markWebhookEventProcessed = async (
  eventId: string
): Promise<void> => {
  await query(`UPDATE webhook_events SET processed = true WHERE id = $1`, [
    eventId,
  ]);
};
