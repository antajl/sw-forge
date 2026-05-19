-- Run on existing D1 database (remote) when shares is missing BOTH columns.
--   npx wrangler d1 execute swf-db --remote --file=./migrate-shares-columns.sql
--
-- If you get "duplicate column name: expires_at", you already have expires_at — run instead:
--   npx wrangler d1 execute swf-db --remote --file=./migrate-shares-wizard-name.sql
--
-- Error this fixes: D1_ERROR: table shares has no column named wizard_name

ALTER TABLE shares ADD COLUMN wizard_name TEXT NOT NULL DEFAULT '';
ALTER TABLE shares ADD COLUMN expires_at INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares (expires_at);
