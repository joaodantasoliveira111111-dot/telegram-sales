ALTER TABLE bots ADD COLUMN IF NOT EXISTS flow_type text DEFAULT 'direct';
-- Values: 'direct' | 'presentation' | 'consultive'
