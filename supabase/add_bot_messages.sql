create table if not exists bot_messages (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references bots(id) on delete cascade,
  message_key text not null,
  content text not null,
  updated_at timestamptz not null default now(),
  unique(bot_id, message_key)
);

alter table bot_messages enable row level security;
create policy "Allow all for service role" on bot_messages using (true) with check (true);
