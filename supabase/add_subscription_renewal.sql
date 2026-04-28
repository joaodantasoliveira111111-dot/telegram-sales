-- Subscription renewal & kick features
ALTER TABLE plans ADD COLUMN IF NOT EXISTS kick_on_expire boolean DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS renewal_discount_pct int DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_offered_at timestamptz DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewed_from_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notified_days int[] DEFAULT '{}';
