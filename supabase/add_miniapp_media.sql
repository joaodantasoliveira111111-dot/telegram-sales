-- Mini App: custom images (banner, logo already lived in miniapp_config as
-- logo_url — this just adds per-product images). Run after add_miniapp.sql.
-- ------------------------------------------------------------

alter table plans add column if not exists miniapp_image_url text;
