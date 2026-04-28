-- Add country filter to cloakers
ALTER TABLE cloakers ADD COLUMN IF NOT EXISTS allowed_countries text[] DEFAULT NULL;

-- Add country to click log for analytics
ALTER TABLE cloaker_clicks ADD COLUMN IF NOT EXISTS country text DEFAULT NULL;
