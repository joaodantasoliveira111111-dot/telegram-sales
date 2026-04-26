-- Add plan_role to plans table
alter table plans add column if not exists plan_role text not null default 'main'
  check (plan_role in ('main', 'upsell', 'downsell'));
