-- Add scheduling to broadcasts
alter table broadcasts add column if not exists scheduled_at timestamptz;

-- Update status to include 'scheduled'
alter table broadcasts drop constraint if exists broadcasts_status_check;
alter table broadcasts add constraint broadcasts_status_check
  check (status in ('draft', 'scheduled', 'sending', 'sent'));

-- Upsell / Downsell offers
create table if not exists offers (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid not null references bots(id) on delete cascade,
  name text not null,
  type text not null check (type in ('upsell', 'downsell')),
  trigger_plan_id uuid not null references plans(id) on delete cascade,
  offer_plan_id uuid not null references plans(id) on delete cascade,
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table offers enable row level security;
create policy "Allow all for service role" on offers using (true) with check (true);

-- Supabase Storage bucket for media
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read media" on storage.objects
  for select using (bucket_id = 'media');

create policy "Service role insert media" on storage.objects
  for insert with check (bucket_id = 'media');

create policy "Service role delete media" on storage.objects
  for delete using (bucket_id = 'media');
