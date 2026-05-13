-- CreateTable
CREATE TABLE messages (
  id UUID PRIMARY KEY,

  account_id UUID REFERENCES accounts (id),

  contact_id UUID REFERENCES contacts (id),

  campaign_id UUID REFERENCES campaigns (id),

  meta_message_id TEXT,

  direction TEXT,
  message_type TEXT,

  message_text TEXT,

  delivery_status TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_account_id ON messages (account_id);
CREATE INDEX idx_messages_contact_id ON messages (contact_id);
CREATE INDEX idx_messages_campaign_id ON messages (campaign_id);
CREATE INDEX idx_messages_meta_message_id ON messages (meta_message_id);
CREATE INDEX idx_messages_direction ON messages (direction);
CREATE INDEX idx_messages_message_type ON messages (message_type);
CREATE INDEX idx_messages_delivery_status ON messages (delivery_status);
CREATE INDEX idx_messages_created_at ON messages (created_at);
CREATE INDEX idx_messages_account_id_created_at ON messages (account_id, created_at DESC);
