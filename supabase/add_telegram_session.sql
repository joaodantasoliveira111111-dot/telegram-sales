CREATE TABLE IF NOT EXISTS telegram_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  phone_code_hash text DEFAULT '',
  session_string text DEFAULT '',
  status text DEFAULT 'disconnected', -- 'pending_code' | 'connected'
  account_name text DEFAULT '',
  account_username text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
