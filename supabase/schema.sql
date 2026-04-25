-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- BOTS
create table if not exists bots (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  telegram_token text not null,
  welcome_message text not null default 'Olá! Seja bem-vindo(a).',
  welcome_media_url text,
  welcome_media_type text check (welcome_media_type in ('image', 'video')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- PLANS
create table if not exists plans (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references bots(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  duration_days integer not null,
  button_text text not null default 'Comprar Acesso',
  content_type text not null check (content_type in ('link', 'telegram_channel')),
  content_url text,
  telegram_chat_id text,
  created_at timestamptz not null default now()
);

-- TELEGRAM USERS
create table if not exists telegram_users (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references bots(id) on delete cascade,
  telegram_id text not null,
  username text,
  first_name text,
  created_at timestamptz not null default now(),
  unique (bot_id, telegram_id)
);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references bots(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete cascade,
  telegram_id text not null,
  transaction_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled', 'refunded', 'chargeback')),
  pix_code text,
  qr_code text,
  created_at timestamptz not null default now()
);

-- SUBSCRIPTIONS
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references bots(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete cascade,
  telegram_id text not null,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  created_at timestamptz not null default now()
);

-- WEBHOOK LOGS
create table if not exists webhook_logs (
  id uuid primary key default uuid_generate_v4(),
  source text not null default 'amplopay',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- INDEXES
create index if not exists idx_payments_transaction_id on payments(transaction_id);
create index if not exists idx_payments_telegram_id on payments(telegram_id);
create index if not exists idx_subscriptions_telegram_id on subscriptions(telegram_id);
create index if not exists idx_subscriptions_expires_at on subscriptions(expires_at);
create index if not exists idx_telegram_users_bot_telegram on telegram_users(bot_id, telegram_id);

-- ROW LEVEL SECURITY (disable for service role usage)
alter table bots enable row level security;
alter table plans enable row level security;
alter table telegram_users enable row level security;
alter table payments enable row level security;
alter table subscriptions enable row level security;
alter table webhook_logs enable row level security;

-- Allow all operations for authenticated users (adjust as needed)
create policy "Allow all for service role" on bots using (true) with check (true);
create policy "Allow all for service role" on plans using (true) with check (true);
create policy "Allow all for service role" on telegram_users using (true) with check (true);
create policy "Allow all for service role" on payments using (true) with check (true);
create policy "Allow all for service role" on subscriptions using (true) with check (true);
create policy "Allow all for service role" on webhook_logs using (true) with check (true);
