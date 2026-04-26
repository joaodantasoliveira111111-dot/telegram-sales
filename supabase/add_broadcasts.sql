create table if not exists broadcasts (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references bots(id) on delete cascade,
  name text not null,
  message_text text not null,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  target_type text not null check (target_type in ('all', 'unpaid', 'expired', 'active')),
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  sent_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table broadcasts enable row level security;
create policy "Allow all for service role" on broadcasts using (true) with check (true);
