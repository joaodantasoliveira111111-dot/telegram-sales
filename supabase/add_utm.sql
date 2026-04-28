-- UTM tracking on payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_source text DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_medium text DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_campaign text DEFAULT NULL;

-- Also track on telegram_users (first touch)
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS utm_source text DEFAULT NULL;
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS utm_campaign text DEFAULT NULL;
