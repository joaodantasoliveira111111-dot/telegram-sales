CREATE TABLE IF NOT EXISTS redirect_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  bot_id uuid REFERENCES bots(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Meu Canal',
  bio text DEFAULT '',
  photo_url text DEFAULT NULL,
  button_text text NOT NULL DEFAULT 'Abrir no Telegram',
  bot_link text NOT NULL DEFAULT '',
  theme text NOT NULL DEFAULT 'dark',
  show_countdown boolean DEFAULT false,
  countdown_minutes integer DEFAULT 15,
  show_verification boolean DEFAULT false,
  highlights text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_redirect_pages_slug ON redirect_pages(slug);
