-- Fresh D1 install only (empty database).
-- If `shares` already exists with an older shape, use migrate-shares-columns.sql instead.
--
--   npx wrangler d1 execute swf-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  wizard_name TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  expires_at INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares (expires_at);
