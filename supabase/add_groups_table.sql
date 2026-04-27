CREATE TABLE IF NOT EXISTS telegram_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text DEFAULT 'group',         -- 'group' | 'channel'
  title text NOT NULL,
  description text DEFAULT '',
  telegram_chat_id text DEFAULT '',
  invite_link text DEFAULT '',
  photo_url text DEFAULT '',
  member_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
