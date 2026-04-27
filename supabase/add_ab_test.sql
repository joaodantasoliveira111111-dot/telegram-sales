-- A/B test config on bots
ALTER TABLE bots ADD COLUMN IF NOT EXISTS ab_test_enabled boolean DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS flow_type_b text DEFAULT 'presentation';

-- Track which variant each user was assigned
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS ab_variant text DEFAULT NULL;
