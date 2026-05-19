-- Only when shares already has expires_at but not wizard_name:
--   npx wrangler d1 execute swf-db --remote --file=./migrate-shares-wizard-name.sql
--
-- Error this fixes: D1_ERROR: table shares has no column named wizard_name

ALTER TABLE shares ADD COLUMN wizard_name TEXT NOT NULL DEFAULT '';
