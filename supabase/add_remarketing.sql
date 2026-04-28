-- Remarketing sequences: time-based follow-up flows triggered by user actions
CREATE TABLE IF NOT EXISTS remarketing_sequences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      uuid REFERENCES bots(id) ON DELETE CASCADE,
  name        text NOT NULL,
  trigger     text NOT NULL CHECK (trigger IN ('no_payment', 'no_interaction')),
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Each sequence has ordered steps (messages sent at specific delays)
CREATE TABLE IF NOT EXISTS remarketing_steps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES remarketing_sequences(id) ON DELETE CASCADE,
  position    int  NOT NULL,
  delay_hours int  NOT NULL,
  message_text text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Per-lead sends queued by the bot webhook
CREATE TABLE IF NOT EXISTS remarketing_sends (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id       uuid REFERENCES remarketing_steps(id) ON DELETE CASCADE,
  bot_id        uuid REFERENCES bots(id) ON DELETE CASCADE,
  telegram_id   text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at       timestamptz,
  status        text DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  error_msg     text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_remarketing_sends_pending
  ON remarketing_sends (status, scheduled_for)
  WHERE status = 'pending';
