-- CreateTable
CREATE TABLE posts (
  id UUID PRIMARY KEY,

  account_id UUID REFERENCES accounts (id),

  media_asset_id UUID REFERENCES media_assets (id),

  caption TEXT,

  scheduled_at TIMESTAMP,

  publish_status TEXT DEFAULT 'draft',

  published_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_account_id ON posts (account_id);
CREATE INDEX idx_posts_media_asset_id ON posts (media_asset_id);
CREATE INDEX idx_posts_publish_status ON posts (publish_status);
CREATE INDEX idx_posts_scheduled_at ON posts (scheduled_at);
CREATE INDEX idx_posts_account_id_publish_status ON posts (account_id, publish_status);
