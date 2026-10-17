-- =====================================================================
-- Stage 5: the platform's back office (/admin).
-- 1. Devices of platform admins that receive platform notifications.
-- 2. Server errors, recorded by the app (instrumentation.ts).
-- 3. Free-tier usage: database size and files in Storage.
-- 4. Why a wedding was suspended (shown to nobody but the admins).
-- All of it is server-only: RLS on, no client policies.
-- =====================================================================

create table public.platform_push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  endpoint      text not null unique check (endpoint ~ '^https://'),
  p256dh        text not null,
  auth          text not null,
  device_label  text check (char_length(device_label) <= 40),
  created_at    timestamptz not null default now()
);
create index platform_push_subscriptions_user_idx on public.platform_push_subscriptions (user_id);

create table public.error_log (
  id           bigint generated always as identity primary key,
  occurred_at  timestamptz not null default now(),
  source       text not null check (char_length(source) <= 40),
  message      text not null check (char_length(message) <= 2000),
  digest       text check (char_length(digest) <= 100),
  path         text check (char_length(path) <= 300),
  details      jsonb not null default '{}'
);
create index error_log_time_idx on public.error_log (occurred_at desc);

alter table public.platform_push_subscriptions enable row level security;
alter table public.error_log enable row level security;
revoke all on public.platform_push_subscriptions, public.error_log from anon, authenticated;
grant all on public.platform_push_subscriptions, public.error_log to service_role;

alter table public.weddings add column suspension_reason text check (char_length(suspension_reason) <= 300);

-- Database size and Storage usage, for the free-tier gauges.
create function public.platform_usage()
returns table (database_bytes bigint, storage_bytes bigint, storage_files bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pg_database_size(current_database()),
    coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint,
    count(o.id)
  from storage.objects o;
$$;

-- Storage used by each wedding (its files live in a folder named after it).
create function public.storage_by_wedding()
returns table (wedding_id uuid, bytes bigint, files bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (storage.foldername(o.name))[1]::uuid,
    coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint,
    count(*)
  from storage.objects o
  where o.bucket_id = 'wedding-media'
    and (storage.foldername(o.name))[1] ~ '^[0-9a-f-]{36}$'
  group by 1;
$$;

revoke all on function public.platform_usage() from public, anon, authenticated;
revoke all on function public.storage_by_wedding() from public, anon, authenticated;
grant execute on function public.platform_usage() to service_role;
grant execute on function public.storage_by_wedding() to service_role;
