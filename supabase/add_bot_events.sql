-- ab_variant on payments for funnel split
ALTER TABLE payments ADD COLUMN IF NOT EXISTS ab_variant text DEFAULT NULL;

CREATE TABLE IF NOT EXISTS bot_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  telegram_id text NOT NULL,
  event_type text NOT NULL, -- 'start' | 'plan_click' | 'pix_generated' | 'payment_confirmed'
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  ab_variant text DEFAULT NULL, -- 'a' | 'b'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bot_events_bot_id_idx ON bot_events(bot_id);
CREATE INDEX IF NOT EXISTS bot_events_event_type_idx ON bot_events(bot_id, event_type);
CREATE INDEX IF NOT EXISTS bot_events_created_at_idx ON bot_events(bot_id, created_at DESC);
