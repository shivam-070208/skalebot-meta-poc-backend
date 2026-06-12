ALTER TABLE posts DROP COLUMN media_asset_id;
DROP TABLE media_assets;

ALTER TABLE posts ADD COLUMN external_media_id TEXT ;