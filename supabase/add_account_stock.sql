-- Account stock table
create table if not exists account_stocks (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid references bots(id) on delete set null,
  plan_id uuid references plans(id) on delete set null,
  product_name text not null,
  login text not null,
  password text not null,
  extra_info text,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'delivered', 'replaced', 'blocked')),
  delivered_to_telegram_id text,
  delivered_payment_id uuid,
  delivered_at timestamptz,
  warranty_until timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table account_stocks enable row level security;
create policy "Allow all for service role" on account_stocks using (true) with check (true);

-- Atomic reservation function (prevents race conditions)
create or replace function reserve_account(p_plan_id uuid, p_payment_id uuid, p_telegram_id text)
returns setof account_stocks
language plpgsql
as $$
declare
  v_account account_stocks;
begin
  select * into v_account
  from account_stocks
  where plan_id = p_plan_id and status = 'available'
  order by created_at asc
  limit 1
  for update skip locked;

  if v_account.id is null then
    return;
  end if;

  update account_stocks
  set status = 'reserved',
      delivered_to_telegram_id = p_telegram_id,
      delivered_payment_id = p_payment_id,
      updated_at = now()
  where id = v_account.id
  returning * into v_account;

  return next v_account;
end;
$$;

-- Add account_stock as valid content_type for plans
alter table plans drop constraint if exists plans_content_type_check;
alter table plans add constraint plans_content_type_check
  check (content_type in ('link', 'telegram_channel', 'account_stock'));
