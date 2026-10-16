-- =====================================================================
-- SaaS foundation (Lazo de Oro): accounts, plans, wedding lifecycle,
-- per-wedding RSVP and guestbook settings, analytics and audit trail.
--
-- Lifecycle of a wedding (`weddings.status`):
--   draft      created by an account, never published yet
--   active     published at least once; the couple edits freely
--   read_only  30 days after the event: visible, but nothing changes
--   archived   12 months later: hidden, media removed
--   suspended  hidden by the platform (abuse)
-- Only the platform (server role) changes the lifecycle; publishing a
-- draft makes it active automatically.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Plans. Everything is free today; paid plans can be added later
--    without touching weddings (each wedding already points to a plan).
-- ---------------------------------------------------------------------
create table public.plans (
  code         text primary key check (code ~ '^[a-z][a-z0-9_]{1,30}$'),
  name         text not null,
  price_cents  integer not null default 0 check (price_cents >= 0),
  currency     text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  features     jsonb not null default '{}',
  is_active    boolean not null default true,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now()
);

insert into public.plans (code, name, features) values (
  'free',
  'Gratis',
  '{"templates": "all", "gallery3d": true, "music": true, "gifts": true, "branding": true, "max_photos": 30, "max_weddings": 3}'
);

-- ---------------------------------------------------------------------
-- 2. Weddings: lifecycle, plan, owner account and couple settings.
-- ---------------------------------------------------------------------
create or replace function private.is_reserved_slug(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_slug = any (array[
    'admin', 'panel', 'crear', 'entrar', 'salir', 'cuenta', 'login', 'registro',
    'api', 'auth', 'app', 'www', 'static', 'media', 'icons', 'sw', 'manifest',
    'sitemap', 'robots', 'favicon', 'plantillas', 'precios', 'donar', 'ayuda',
    'soporte', 'legal', 'terminos', 'privacidad', 'blog', 'vista-previa',
    'ejemplo', 'boda', 'bodas', 'invitacion', 'invitaciones', 'lazodoro', 'lazo-de-oro'
  ]);
$$;

alter table public.weddings
  add column status text not null default 'draft'
    check (status in ('draft', 'active', 'read_only', 'archived', 'suspended')),
  add column plan_code text not null default 'free' references public.plans (code),
  add column created_by uuid references auth.users (id) on delete set null,
  add column published_at timestamptz,
  add column read_only_at timestamptz,
  add column archived_at timestamptz,
  -- How the reply form asks for companions: one name each, or just how many.
  add column companions_mode text not null default 'names' check (companions_mode in ('names', 'count')),
  -- Show the guests' wishes on the invitation (hidden ones never show).
  add column guestbook_public boolean not null default false,
  add constraint weddings_slug_allowed check (char_length(slug) between 3 and 60 and not private.is_reserved_slug(slug));

-- Weddings that already exist were set up by hand and are live.
update public.weddings
set status = 'active',
    published_at = case when is_published then now() end;

create index weddings_plan_code_idx on public.weddings (plan_code);
create index weddings_created_by_idx on public.weddings (created_by);

-- ---------------------------------------------------------------------
-- 3. RSVPs in "count" mode store only how many companions come.
-- ---------------------------------------------------------------------
alter table public.rsvps
  add column companions_count smallint,
  add constraint rsvps_companions_count_valid
    check (companions_count is null or (companions_count between 0 and 50 and (attending or companions_count = 0)));

-- Wishes the couple hides never appear in the public guestbook.
alter table public.wishes
  add column is_hidden boolean not null default false;

-- ---------------------------------------------------------------------
-- 4. Accounts: a profile per user and the platform administrators.
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text check (char_length(display_name) <= 120),
  avatar_url    text check (char_length(avatar_url) <= 500),
  locale        text not null default 'es' check (locale in ('es', 'en')),
  country       text check (country ~ '^[A-Z]{2}$'),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120),
    left(new.raw_user_meta_data ->> 'avatar_url', 500)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

insert into public.profiles (id, display_name)
select u.id, left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), 120)
from auth.users u
on conflict (id) do nothing;

create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'superadmin' check (role in ('superadmin', 'support')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Product analytics (no cookies: a random id kept on the device) and
--    an audit trail of sensitive actions. Written only by the server.
-- ---------------------------------------------------------------------
create table public.analytics_events (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  name           text not null check (name ~ '^[a-z][a-z0-9_]{1,40}$'),
  anonymous_id   uuid,
  user_id        uuid references auth.users (id) on delete set null,
  wedding_id     uuid references public.weddings (id) on delete set null,
  path           text check (char_length(path) <= 300),
  referrer_host  text check (char_length(referrer_host) <= 200),
  utm_source     text check (char_length(utm_source) <= 100),
  utm_medium     text check (char_length(utm_medium) <= 100),
  utm_campaign   text check (char_length(utm_campaign) <= 100),
  country        text check (country ~ '^[A-Z]{2}$'),
  device         text check (device in ('mobile', 'tablet', 'desktop')),
  properties     jsonb not null default '{}'
);

create index analytics_events_name_time_idx on public.analytics_events (name, occurred_at desc);
create index analytics_events_time_idx on public.analytics_events (occurred_at desc);
create index analytics_events_user_idx on public.analytics_events (user_id);
create index analytics_events_wedding_idx on public.analytics_events (wedding_id);

create table public.audit_log (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  -- null when the platform itself acted (daily job).
  actor_user_id  uuid references auth.users (id) on delete set null,
  action         text not null check (action ~ '^[a-z][a-z0-9_.]{1,60}$'),
  target_type    text not null check (char_length(target_type) <= 40),
  target_id      text check (char_length(target_id) <= 100),
  details        jsonb not null default '{}'
);

create index audit_log_time_idx on public.audit_log (created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_user_id);

-- ---------------------------------------------------------------------
-- 6. Lifecycle rules enforced by the database.
-- ---------------------------------------------------------------------

-- Guests see weddings that are published and active or read-only.
create or replace function private.is_published_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.weddings w
    where w.id = p_wedding_id and w.is_published and w.status in ('active', 'read_only')
  );
$$;

-- Owners edit only while the wedding is a draft or active.
create or replace function private.can_edit_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members m
    join public.weddings w on w.id = m.wedding_id
    where m.wedding_id = p_wedding_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and w.status in ('draft', 'active')
  );
$$;

create or replace function private.can_manage_storage_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_edit_wedding(w.id)
  from public.weddings w
  where w.id::text = (storage.foldername(object_name))[1];
$$;

revoke all on function private.can_edit_wedding(uuid) from public, anon;
grant execute on function private.can_edit_wedding(uuid) to authenticated, service_role;

-- Runs as the caller (no SECURITY DEFINER) so `current_user` is the API role.
create or replace function private.weddings_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and current_user in ('anon', 'authenticated') then
    if (new.status, new.plan_code, new.created_by, new.published_at, new.read_only_at, new.archived_at)
       is distinct from
       (old.status, old.plan_code, old.created_by, old.published_at, old.read_only_at, old.archived_at) then
      raise exception 'Only the platform can change the lifecycle of a wedding' using errcode = '42501';
    end if;
  end if;

  -- Publishing for the first time turns a draft into an active wedding.
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    new.published_at := coalesce(new.published_at, now());
    if new.status = 'draft' then
      new.status := 'active';
    end if;
  end if;
  return new;
end;
$$;

create trigger weddings_lifecycle
  before insert or update on public.weddings
  for each row execute function private.weddings_lifecycle();

-- Each plan caps how many live weddings an account can create.
create or replace function private.weddings_limit_per_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_allowed int;
begin
  if new.created_by is null then
    return new;
  end if;
  select (p.features ->> 'max_weddings')::int into max_allowed from public.plans p where p.code = new.plan_code;
  if max_allowed is not null and (
    select count(*) from public.weddings w where w.created_by = new.created_by and w.status <> 'archived'
  ) >= max_allowed then
    raise exception 'WEDDING_LIMIT';
  end if;
  return new;
end;
$$;

create trigger weddings_limit_per_account
  before insert on public.weddings
  for each row execute function private.weddings_limit_per_account();

-- Answers can only be added or changed while the wedding is open.
create or replace function private.rsvps_require_open_wedding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.weddings w where w.id = new.wedding_id and w.status in ('draft', 'active')
  ) then
    raise exception 'RSVP_CLOSED';
  end if;
  return new;
end;
$$;

create trigger rsvps_require_open_wedding
  before insert or update on public.rsvps
  for each row execute function private.rsvps_require_open_wedding();

-- The public reply flow only finds weddings guests can see.
create or replace function public.rsvp_open_wedding(p_slug text)
returns public.weddings
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w public.weddings%rowtype;
begin
  select * into w
  from public.weddings
  where slug = p_slug and is_published and status in ('active', 'read_only');
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;
  return w;
end;
$$;

-- Trigger functions are never called directly.
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.weddings_lifecycle() from public, anon, authenticated;
revoke all on function private.weddings_limit_per_account() from public, anon, authenticated;
revoke all on function private.rsvps_require_open_wedding() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Row Level Security.
-- ---------------------------------------------------------------------

-- Weddings: visibility follows the lifecycle; owners edit open weddings.
drop policy "Public reads published weddings" on public.weddings;
drop policy "Members read their wedding or published ones" on public.weddings;
drop policy "Owners update their wedding" on public.weddings;
create policy "Public reads published weddings" on public.weddings
  for select to anon using (is_published and status in ('active', 'read_only'));
create policy "Members read their wedding or published ones" on public.weddings
  for select to authenticated
  using ((is_published and status in ('active', 'read_only')) or private.is_wedding_member(id));
create policy "Owners update their wedding" on public.weddings
  for update to authenticated
  using (private.can_edit_wedding(id)) with check (private.can_edit_wedding(id));

-- Owners' writes stop when the wedding becomes read-only.
do $$
declare
  t text;
begin
  foreach t in array array['sections', 'media', 'gift_methods', 'rsvps', 'rsvp_companions', 'wishes', 'wedding_private']
  loop
    execute format('drop policy "Owners insert %1$s" on public.%1$I', t);
    execute format('drop policy "Owners update %1$s" on public.%1$I', t);
    execute format('drop policy "Owners delete %1$s" on public.%1$I', t);
    execute format(
      'create policy "Owners insert %1$s" on public.%1$I for insert to authenticated
         with check (private.can_edit_wedding(wedding_id))', t);
    execute format(
      'create policy "Owners update %1$s" on public.%1$I for update to authenticated
         using (private.can_edit_wedding(wedding_id)) with check (private.can_edit_wedding(wedding_id))', t);
    execute format(
      'create policy "Owners delete %1$s" on public.%1$I for delete to authenticated
         using (private.can_edit_wedding(wedding_id))', t);
  end loop;
end;
$$;

-- New tables: RLS on, explicit grants (the project exposes nothing by default).
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.plans, public.profiles, public.platform_admins, public.analytics_events, public.audit_log
  from anon, authenticated;
grant all on public.plans, public.profiles, public.platform_admins, public.analytics_events, public.audit_log
  to service_role;

grant select on public.plans to anon, authenticated;
create policy "Everyone reads active plans" on public.plans
  for select to anon, authenticated using (is_active);

grant select on public.profiles to authenticated;
grant update (display_name, locale, country) on public.profiles to authenticated;
create policy "Accounts read their profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Accounts update their profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Lets the app ask "is this account an administrator?" with the user's session.
grant select on public.platform_admins to authenticated;
create policy "Accounts read their admin role" on public.platform_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- analytics_events and audit_log: no client policies; only the server writes and reads them.
