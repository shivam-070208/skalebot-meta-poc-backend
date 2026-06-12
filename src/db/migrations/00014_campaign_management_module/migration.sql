-- Replace legacy campaigns shape with campaign management module
DROP TABLE IF EXISTS campaign_buttons CASCADE;
DROP TABLE IF EXISTS campaign_contents CASCADE;
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  audience_scope TEXT NOT NULL DEFAULT 'specific',
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE campaign_contents (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  text_content TEXT,
  media_url TEXT,
  link_url TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_buttons (
  id UUID PRIMARY KEY,
  campaign_content_id UUID NOT NULL REFERENCES campaign_contents (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_value TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, contact_id)
);

CREATE INDEX idx_campaigns_account_id ON campaigns (account_id);
CREATE INDEX idx_campaigns_status ON campaigns (status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns (scheduled_at);
CREATE INDEX idx_campaigns_deleted_at ON campaigns (deleted_at);
CREATE INDEX idx_campaigns_account_status ON campaigns (account_id, status)
WHERE deleted_at IS NULL;

CREATE INDEX idx_campaign_contents_campaign_id ON campaign_contents (campaign_id);
CREATE INDEX idx_campaign_buttons_content_id ON campaign_buttons (campaign_content_id);
CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients (campaign_id);
CREATE INDEX idx_campaign_recipients_contact_id ON campaign_recipients (contact_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients (status);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notification_token TEXT;
