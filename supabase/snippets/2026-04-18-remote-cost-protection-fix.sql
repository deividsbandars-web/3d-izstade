-- Remote fix for governance usage tracking support tables.
-- Safe to run against an environment that may already have the Phase 6 tables.

create extension if not exists pgcrypto;

create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  provider text not null,
  model text,
  prompt_tokens integer default 0,
  completion_tokens integer default 0,
  total_tokens integer default 0,
  estimated_cost_usd numeric default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.user_daily_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  usage_date date default current_date,
  total_requests integer default 0,
  total_credits_consumed integer default 0,
  unique(user_id, usage_date)
);

alter table public.api_usage_logs enable row level security;
alter table public.user_daily_limits enable row level security;

drop policy if exists "Users can view their own API usage" on public.api_usage_logs;
create policy "Users can view their own API usage"
on public.api_usage_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can view their own daily limits" on public.user_daily_limits;
create policy "Users can view their own daily limits"
on public.user_daily_limits
for select
using (auth.uid() = user_id);

create or replace function public.increment_daily_usage(
  target_user_id uuid,
  usage_date date,
  credit_amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_daily_limits (
    user_id,
    usage_date,
    total_requests,
    total_credits_consumed
  )
  values (
    target_user_id,
    usage_date,
    1,
    coalesce(credit_amount, 0)
  )
  on conflict (user_id, usage_date)
  do update set
    total_requests = public.user_daily_limits.total_requests + 1,
    total_credits_consumed = public.user_daily_limits.total_credits_consumed + coalesce(excluded.total_credits_consumed, 0);
end;
$$;

revoke all on function public.increment_daily_usage(uuid, date, integer) from public;
grant execute on function public.increment_daily_usage(uuid, date, integer) to authenticated;
grant execute on function public.increment_daily_usage(uuid, date, integer) to service_role;

select
  to_regclass('public.api_usage_logs') as api_usage_logs_table,
  to_regclass('public.user_daily_limits') as user_daily_limits_table;
