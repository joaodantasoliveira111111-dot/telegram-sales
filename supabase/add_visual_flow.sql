-- Visual flow editor
ALTER TABLE bots ADD COLUMN IF NOT EXISTS flow_config jsonb DEFAULT NULL;

-- Track which node each user is currently at in the visual flow
CREATE TABLE IF NOT EXISTS flow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  telegram_id text NOT NULL,
  current_node_id text NOT NULL,
  state jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bot_id, telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_flow_sessions_bot_telegram ON flow_sessions(bot_id, telegram_id);

-- Anti-fraud: protect_content per plan
ALTER TABLE plans ADD COLUMN IF NOT EXISTS protect_content boolean DEFAULT false;
-- Anti-fraud: protect at bot level (applies to all content delivery)
ALTER TABLE bots ADD COLUMN IF NOT EXISTS protect_content boolean DEFAULT false;
