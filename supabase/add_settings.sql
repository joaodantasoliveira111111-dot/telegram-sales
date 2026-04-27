CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Default keys (empty — user fills via dashboard)
INSERT INTO settings (key, value) VALUES
  ('amplopay_public_key', ''),
  ('amplopay_secret_key', ''),
  ('amplopay_webhook_token', ''),
  ('meta_pixel_id', ''),
  ('meta_access_token', ''),
  ('meta_test_event_code', ''),
  ('meta_track_purchase', 'true'),
  ('meta_track_initiate_checkout', 'true'),
  ('meta_track_view_content', 'false')
ON CONFLICT (key) DO NOTHING;
