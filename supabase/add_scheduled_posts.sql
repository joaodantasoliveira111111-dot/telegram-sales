-- Scheduled content posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  chat_id text NOT NULL,
  chat_title text DEFAULT NULL,
  message_text text DEFAULT NULL,
  media_url text DEFAULT NULL,
  media_type text DEFAULT NULL, -- 'photo' | 'video' | null
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  error_msg text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_bot_id ON scheduled_posts(bot_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
