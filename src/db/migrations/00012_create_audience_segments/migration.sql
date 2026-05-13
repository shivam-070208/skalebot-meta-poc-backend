-- CreateTable
CREATE TABLE audience_segments (
  id UUID PRIMARY KEY,

  account_id UUID REFERENCES accounts (id),

  name TEXT,

  rules JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audience_segments_account_id ON audience_segments (account_id);
CREATE INDEX idx_audience_segments_name ON audience_segments (name);
CREATE INDEX idx_audience_segments_rules_gin ON audience_segments USING GIN (rules);
