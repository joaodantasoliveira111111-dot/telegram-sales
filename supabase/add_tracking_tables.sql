-- Track who received each broadcast (prevents duplicate sends)
create table if not exists broadcast_recipients (
  broadcast_id uuid not null references broadcasts(id) on delete cascade,
  telegram_id text not null,
  sent_at timestamptz not null default now(),
  primary key (broadcast_id, telegram_id)
);

-- Track who received each offer/downsell (prevents duplicate sends)
create table if not exists offer_sends (
  offer_id uuid not null references offers(id) on delete cascade,
  telegram_id text not null,
  sent_at timestamptz not null default now(),
  primary key (offer_id, telegram_id)
);
