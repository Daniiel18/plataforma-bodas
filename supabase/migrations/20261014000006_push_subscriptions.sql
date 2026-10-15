-- =====================================================================
-- Push notifications: the couple's devices that receive alerts.
-- Replaces email alerts (the email in wedding_private is no longer used).
-- =====================================================================

create table public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  endpoint      text not null unique check (endpoint ~ '^https://'),
  p256dh        text not null,
  auth          text not null,
  device_label  text,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create index push_subscriptions_wedding_idx on public.push_subscriptions (wedding_id);

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;

create policy "Novios gestionan sus dispositivos" on public.push_subscriptions
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));
