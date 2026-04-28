-- Affiliate system
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  telegram_id text DEFAULT NULL,
  commission_pct numeric(5,2) NOT NULL DEFAULT 10,
  total_sales int DEFAULT 0,
  total_earned numeric(10,2) DEFAULT 0,
  total_paid numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bot_id, code)
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS affiliate_code text DEFAULT NULL;
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS affiliate_code text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_affiliates_bot_id ON affiliates(bot_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);
CREATE INDEX IF NOT EXISTS idx_payments_affiliate_code ON payments(affiliate_code);
