-- SaaS data isolation: add saas_user_id to tables that need per-user scoping
-- Run in Supabase SQL Editor after add_saas_users.sql

-- ── telegram_groups (groups & channels) ─────────────────────────────────────
alter table public.telegram_groups
  add column if not exists saas_user_id uuid references public.saas_users(id) on delete set null;

create index if not exists telegram_groups_saas_user_id_idx on public.telegram_groups(saas_user_id);

-- ── telegram_sessions (MTProto per user) ─────────────────────────────────────
-- Drop the old UNIQUE on phone (now each user can have their own session)
alter table public.telegram_sessions
  add column if not exists saas_user_id uuid references public.saas_users(id) on delete cascade;

create index if not exists telegram_sessions_saas_user_id_idx on public.telegram_sessions(saas_user_id);

-- ── redirect_pages ───────────────────────────────────────────────────────────
alter table public.redirect_pages
  add column if not exists saas_user_id uuid references public.saas_users(id) on delete set null;

create index if not exists redirect_pages_saas_user_id_idx on public.redirect_pages(saas_user_id);

-- ── cloakers ─────────────────────────────────────────────────────────────────
alter table public.cloakers
  add column if not exists saas_user_id uuid references public.saas_users(id) on delete set null;

create index if not exists cloakers_saas_user_id_idx on public.cloakers(saas_user_id);

-- ── saas_users: add billing fields ───────────────────────────────────────────
alter table public.saas_users
  add column if not exists billing_payment_id   text,
  add column if not exists billing_payment_qr   text,
  add column if not exists billing_payment_code text,
  -- per-user pixel config (global fallback for all their bots)
  add column if not exists meta_pixel_id        text,
  add column if not exists meta_access_token    text,
  add column if not exists tiktok_pixel_id      text,
  add column if not exists tiktok_access_token  text,
  add column if not exists ga4_measurement_id   text,
  add column if not exists ga4_api_secret       text,
  add column if not exists gtm_container_id     text,
  add column if not exists kwai_pixel_id        text,
  add column if not exists kwai_access_token    text;
