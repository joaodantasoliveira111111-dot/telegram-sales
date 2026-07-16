-- Custom product types for account_stock plans
-- Lets the admin define arbitrary delivery fields (login, senha, contra-senha,
-- código de recuperação, etc.) instead of the fixed login/password pair, plus
-- an optional custom delivery message template.
-- ------------------------------------------------------------

create table if not exists product_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  -- [{ "key": "login", "label": "Login" }, { "key": "senha", "label": "Senha" }, ...]
  fields jsonb not null default '[]',
  -- optional custom message template using {key} placeholders matching field keys,
  -- plus {plano} and {garantia}. Falls back to an auto-generated list when null.
  message_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table product_types enable row level security;
create policy "Allow all for service role" on product_types using (true) with check (true);

-- Link a plan to a product type (only meaningful when content_type = 'account_stock')
alter table plans add column if not exists product_type_id uuid references product_types(id) on delete set null;

-- Store arbitrary field values per stock item; login/password stay for the
-- legacy/default flow (product_type_id is null) and become optional.
alter table account_stocks add column if not exists custom_fields jsonb not null default '{}';
alter table account_stocks alter column login drop not null;
alter table account_stocks alter column password drop not null;
alter table account_stocks add constraint account_stocks_has_credentials
  check (login is not null and password is not null or custom_fields <> '{}'::jsonb);
