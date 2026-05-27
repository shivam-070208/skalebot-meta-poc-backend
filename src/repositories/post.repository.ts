import { randomUUID } from "crypto";
import { pool, query } from "@/config/db";
import type { AutomationRuleRow } from "@/types/automation";
import type { PostRow } from "@/types/post";
import ApiError from "@/utils/api-error";

type CreatePostParams = {
  accountId: string;
  caption: string | null;
  mediaUrl: string;
  scheduledAt: Date | null;
  publishStatus: string;
  externalMediaId?: string | null;
};

type CreateRuleParams = {
  triggerType: string;
  triggerValue: string;
  actionType: string;
  actionValue: string;
};

export const findPostById = async (postId: string): Promise<PostRow | null> => {
  const res = await query(
    `SELECT id, account_id, media_url, caption,
            scheduled_at, publish_status, published_at, created_at,
            external_media_id
     FROM posts WHERE id = $1 LIMIT 1`,
    [postId]
  );
  return res.rows[0] ?? null;
};

export const findPostForUser = async (
  postId: string,
  userId: string
): Promise<PostRow | null> => {
  const res = await query(
    `SELECT p.id, p.account_id, p.media_url, p.caption,
            p.scheduled_at, p.publish_status, p.published_at, p.created_at,
            p.external_media_id
     FROM posts p
     INNER JOIN accounts a ON a.id = p.account_id
     WHERE p.id = $1 AND a.user_id = $2
     LIMIT 1`,
    [postId, userId]
  );
  return res.rows[0] ?? null;
};

export const createPostWithOptionalRule = async (
  postParams: CreatePostParams,
  ruleParams: CreateRuleParams | null
): Promise<{ post: PostRow; rule: AutomationRuleRow | null }> => {
  const client = await pool.connect();
  const postId = randomUUID();

  try {
    await client.query("BEGIN");

    const postRes = await client.query(
      `INSERT INTO posts (
         id, account_id, media_url, caption, scheduled_at, publish_status, external_media_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, account_id, media_url, caption,
                 scheduled_at, publish_status, published_at, created_at, external_media_id`,
      [
        postId,
        postParams.accountId,
        postParams.mediaUrl,
        postParams.caption,
        postParams.scheduledAt,
        postParams.publishStatus,
        postParams.externalMediaId ?? null,
      ]
    );
    const post = postRes.rows[0];
    if (!post) {
      throw new ApiError("HTTP_500_INTERNAL_SERVER_ERROR", "Post insert failed");
    }

    let rule: AutomationRuleRow | null = null;
    if (ruleParams) {
      const ruleId = randomUUID();
      const ruleRes = await client.query(
        `INSERT INTO automation_rules (
           id, post_id, trigger_type, trigger_value, action_type , action_value
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, post_id, trigger_type, trigger_value, action_type, action_value,
                   is_active, created_at`,
        [
          ruleId,
          postId,
          ruleParams.triggerType,
          ruleParams.triggerValue,
          ruleParams.actionType,
          ruleParams.actionValue
        ]
      );
      rule = ruleRes.rows[0] ?? null;
    }

    await client.query("COMMIT");
    return { post, rule };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updatePostPublishStatus = async (
  postId: string,
  publishStatus: string,
  publishedAt?: Date
): Promise<void> => {
  if (publishedAt) {
    await query(
      `UPDATE posts SET publish_status = $2, published_at = $3 WHERE id = $1`,
      [postId, publishStatus, publishedAt]
    );
    return;
  }
  await query(`UPDATE posts SET publish_status = $2 WHERE id = $1`, [
    postId,
    publishStatus,
  ]);
};

export const setPostExternalMediaId = async (
  postId: string,
  externalMediaId: string
): Promise<void> => {
  await query(
    `UPDATE posts SET external_media_id = $2 WHERE id = $1`,
    [postId, externalMediaId]
  );
};


export const findPostByExternalMediaId = async (
  externalMediaId: string
): Promise<PostRow | null> => {
  const res = await query(
    `SELECT id, account_id, media_url, caption,
            scheduled_at, publish_status, published_at, created_at, external_media_id
     FROM posts WHERE external_media_id = $1 LIMIT 1`,
    [externalMediaId]
  );
  return res.rows[0] ?? null;
};