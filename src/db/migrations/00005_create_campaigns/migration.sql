-- CreateTable
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,

  account_id UUID REFERENCES accounts (id),

  title TEXT,
  message TEXT,

  media_url TEXT,
  button_text TEXT,
  button_url TEXT,

  audience_type TEXT,

  scheduled_at TIMESTAMP,

  status TEXT DEFAULT 'draft',

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_account_id ON campaigns (account_id);
CREATE INDEX idx_campaigns_status ON campaigns (status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns (scheduled_at);
CREATE INDEX idx_campaigns_account_id_status ON campaigns (account_id, status);
