-- CreateTable
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,

  account_id UUID REFERENCES accounts (id),

  file_url TEXT,

  media_type TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_assets_account_id ON media_assets (account_id);
CREATE INDEX idx_media_assets_media_type ON media_assets (media_type);
CREATE INDEX idx_media_assets_account_id_media_type ON media_assets (account_id, media_type);
