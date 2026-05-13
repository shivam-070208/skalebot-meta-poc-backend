-- CreateTable
CREATE TABLE contacts (
  id UUID PRIMARY KEY,

  account_id UUID REFERENCES accounts (id),

  instagram_user_id TEXT,
  username TEXT,

  first_interaction TIMESTAMP,
  last_interaction TIMESTAMP,

  window_expires_at TIMESTAMP,

  is_subscribed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contacts_account_id ON contacts (account_id);
CREATE INDEX idx_contacts_instagram_user_id ON contacts (instagram_user_id);
CREATE INDEX idx_contacts_account_id_instagram_user_id ON contacts (account_id, instagram_user_id);
CREATE INDEX idx_contacts_window_expires_at ON contacts (window_expires_at);
CREATE INDEX idx_contacts_is_subscribed ON contacts (is_subscribed);
CREATE INDEX idx_contacts_last_interaction ON contacts (last_interaction);
