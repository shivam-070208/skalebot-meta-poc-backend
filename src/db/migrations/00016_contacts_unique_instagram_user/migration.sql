CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_account_instagram_user_unique
ON contacts (account_id, instagram_user_id)
WHERE instagram_user_id IS NOT NULL;
