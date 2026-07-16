-- Telegram Mini App storefront
-- Per-bot config (theme, branding) lives as a JSON blob on bots — same
-- pattern already used for flow_config. Products are just existing plans
-- flagged to appear in the store, with a bit of extra display metadata.
-- ------------------------------------------------------------

alter table bots add column if not exists miniapp_config jsonb;

alter table plans add column if not exists miniapp_visible boolean not null default false;
alter table plans add column if not exists miniapp_category text;
alter table plans add column if not exists miniapp_icon text;
alter table plans add column if not exists miniapp_featured_label text;
alter table plans add column if not exists miniapp_sort integer not null default 0;

create index if not exists plans_miniapp_visible_idx on plans (bot_id, miniapp_visible) where miniapp_visible = true;
