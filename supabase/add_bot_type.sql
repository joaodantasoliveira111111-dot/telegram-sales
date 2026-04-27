-- Bot type: determines which features are available in management
ALTER TABLE bots ADD COLUMN IF NOT EXISTS bot_type text DEFAULT 'channel_link';
-- Values: 'account_stock' | 'channel_link'
