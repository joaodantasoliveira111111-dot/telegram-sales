-- CRM enhancements on telegram_users
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT NULL;
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS pix_count int DEFAULT 0;
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS paid_count int DEFAULT 0;

-- Creators / agency (simplified: just metadata on bots)
ALTER TABLE bots ADD COLUMN IF NOT EXISTS creator_name text DEFAULT NULL;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS creator_commission_pct numeric(5,2) DEFAULT 0;
