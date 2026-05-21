-- posts: direct media URL for publishing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT;

-- automation_rules: at most one rule per post
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL UNIQUE REFERENCES posts (id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_value TEXT NOT NULL,
  action_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_post_id ON automation_rules (post_id);
CREATE INDEX idx_automation_rules_trigger_lookup ON automation_rules (trigger_type, trigger_value)
WHERE is_active = true;
