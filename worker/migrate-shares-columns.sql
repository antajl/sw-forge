-- Оставляем только то, чего точно нет в базе
ALTER TABLE shares ADD COLUMN expires_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares (expires_at);