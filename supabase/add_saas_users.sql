-- SaaS multi-user system
-- Run this in Supabase SQL Editor

-- ── Users table ─────────────────────────────────────────────────────────────
create table if not exists public.saas_users (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  cpf_cnpj              text,
  email                 text not null unique,
  phone                 text,
  password_hash         text not null,
  password_salt         text not null,
  session_token         text,                       -- rotated on each login
  plan_type             text not null default 'pay_per_use', -- pay_per_use | starter | pro
  is_active             boolean not null default true,
  -- Billing tracking
  sales_count_cycle     integer not null default 0, -- resets on billing cycle
  billing_cycle_start   timestamptz default now(),
  pending_fee_total     numeric(12,2) not null default 0,
  -- Gateway: null = use FlowBot marketplace gateway
  gateway_type          text,                       -- 'amplopay' | 'pushinpay' | null
  gateway_token         text,
  -- Admin payout tracking
  payout_pending        numeric(12,2) not null default 0,
  payout_total_released numeric(12,2) not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Add user_id to bots ──────────────────────────────────────────────────────
alter table public.bots
  add column if not exists saas_user_id uuid references public.saas_users(id) on delete set null;

-- ── Index ────────────────────────────────────────────────────────────────────
create index if not exists saas_users_email_idx on public.saas_users (email);
create index if not exists bots_saas_user_id_idx on public.bots (saas_user_id);

-- ── Add new pixel columns to bots ────────────────────────────────────────────
alter table public.bots
  add column if not exists tiktok_pixel_id     text,
  add column if not exists tiktok_access_token text,
  add column if not exists ga4_measurement_id  text,
  add column if not exists ga4_api_secret      text,
  add column if not exists gtm_container_id    text,
  add column if not exists kwai_pixel_id       text,
  add column if not exists kwai_access_token   text;

-- ── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saas_users_updated_at on public.saas_users;
create trigger saas_users_updated_at
  before update on public.saas_users
  for each row execute function public.set_updated_at();
