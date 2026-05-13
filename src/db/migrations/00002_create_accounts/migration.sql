-- CreateTable
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users (id),

  instagram_account_id TEXT,
  page_id TEXT,

  username TEXT,
  profile_picture TEXT,

  access_token TEXT,
  token_expiry TIMESTAMP,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_accounts_user_id ON accounts (user_id);
CREATE INDEX idx_accounts_instagram_account_id ON accounts (instagram_account_id);
CREATE INDEX idx_accounts_page_id ON accounts (page_id);
CREATE INDEX idx_accounts_is_active ON accounts (is_active);
CREATE INDEX idx_accounts_user_id_is_active ON accounts (user_id, is_active);
