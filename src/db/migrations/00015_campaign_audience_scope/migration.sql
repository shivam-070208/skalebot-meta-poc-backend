ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS audience_scope TEXT NOT NULL DEFAULT 'specific';

CREATE INDEX IF NOT EXISTS idx_campaigns_audience_scope ON campaigns (audience_scope);
