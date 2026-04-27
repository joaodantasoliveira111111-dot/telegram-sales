CREATE TABLE IF NOT EXISTS cloakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES bots(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  destination_url text NOT NULL,  -- onde usuários reais são enviados (t.me/...)
  safe_url text NOT NULL,          -- onde bots/revisores são enviados (página segura)
  is_active boolean DEFAULT true,
  total_clicks int DEFAULT 0,
  human_clicks int DEFAULT 0,
  bot_clicks int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloaker_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cloaker_id uuid NOT NULL REFERENCES cloakers(id) ON DELETE CASCADE,
  verdict text NOT NULL,       -- 'human' | 'bot'
  bot_reason text DEFAULT NULL, -- motivo da detecção
  user_agent text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cloaker_clicks_cloaker_id_idx ON cloaker_clicks(cloaker_id);
CREATE INDEX IF NOT EXISTS cloaker_clicks_created_at_idx ON cloaker_clicks(cloaker_id, created_at DESC);
