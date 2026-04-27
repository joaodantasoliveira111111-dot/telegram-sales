-- Per-bot Meta Pixel settings
ALTER TABLE bots ADD COLUMN IF NOT EXISTS meta_pixel_id text DEFAULT '';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS meta_access_token text DEFAULT '';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS meta_test_event_code text DEFAULT '';
