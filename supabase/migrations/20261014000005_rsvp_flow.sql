-- =====================================================================
-- Public RSVP and wishes flow
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Private wedding data (outside `weddings`, which is public).
--    The notification email must never be readable with the public key.
-- ---------------------------------------------------------------------

create table public.wedding_private (
  wedding_id    uuid primary key references public.weddings(id) on delete cascade,
  notify_email  text check (notify_email is null or notify_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  updated_at    timestamptz not null default now()
);

create trigger wedding_private_updated_at before update on public.wedding_private
  for each row execute function public.set_updated_at();

insert into public.wedding_private (wedding_id, notify_email)
select id, notify_email from public.weddings
on conflict (wedding_id) do nothing;

alter table public.weddings drop column notify_email;

alter table public.wedding_private enable row level security;

grant select, insert, update on public.wedding_private to authenticated;
grant all on public.wedding_private to service_role;

create policy "Novios gestionan sus datos privados" on public.wedding_private
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

-- ---------------------------------------------------------------------
-- 2. Abuse control: anonymous (hashed) fingerprint of the connection.
-- ---------------------------------------------------------------------

alter table public.rsvps add column ip_hash text;
create index rsvps_ip_recent_idx on public.rsvps (wedding_id, ip_hash, created_at desc);

-- ---------------------------------------------------------------------
-- 3. Public flow functions. Only the app server calls them
--    (service_role); the browser never writes to the tables directly.
--    Errors use codes the app turns into ES/EN messages.
-- ---------------------------------------------------------------------

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
  select * into w from public.weddings where slug = p_slug and is_published;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;
  return w;
end;
$$;

-- New answer.
create or replace function public.rsvp_submit(
  p_slug text,
  p_full_name text,
  p_attending boolean,
  p_companions text[],
  p_locale text,
  p_token_hash text,
  p_ip_hash text
)
returns table (rsvp_id uuid, wedding_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.weddings%rowtype := public.rsvp_open_wedding(p_slug);
  companions text[] := coalesce(p_companions, '{}');
  recent integer;
  new_id uuid;
begin
  if w.rsvp_deadline is not null and now() > w.rsvp_deadline then
    raise exception 'RSVP_CLOSED';
  end if;

  if p_ip_hash is not null then
    select count(*) into recent
    from public.rsvps r
    where r.wedding_id = w.id and r.ip_hash = p_ip_hash and r.created_at > now() - interval '10 minutes';
    if recent >= 6 then
      raise exception 'RATE_LIMITED';
    end if;
  end if;

  if not p_attending and cardinality(companions) > 0 then
    raise exception 'INVALID_COMPANIONS';
  end if;
  if cardinality(companions) > w.max_companions then
    raise exception 'TOO_MANY_COMPANIONS';
  end if;

  insert into public.rsvps (wedding_id, full_name, attending, locale, edit_token_hash, ip_hash)
  values (w.id, trim(p_full_name), p_attending, coalesce(p_locale, 'es'), p_token_hash, p_ip_hash)
  returning id into new_id;

  insert into public.rsvp_companions (rsvp_id, full_name, position)
  select new_id, trim(c.name), (c.ord - 1)::smallint
  from unnest(companions) with ordinality as c(name, ord);

  return query select new_id, w.id;
end;
$$;

-- Status of the guest's own answer (for returning visits by link or device).
create or replace function public.rsvp_status(p_slug text, p_token_hash text)
returns table (
  rsvp_id uuid,
  full_name text,
  attending boolean,
  companions text[],
  has_wish boolean,
  can_change boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w public.weddings%rowtype := public.rsvp_open_wedding(p_slug);
begin
  return query
  select
    r.id,
    r.full_name,
    r.attending,
    coalesce(array(select c.full_name from public.rsvp_companions c where c.rsvp_id = r.id order by c.position), '{}'),
    exists (select 1 from public.wishes x where x.rsvp_id = r.id),
    (w.rsvp_deadline is null or now() <= w.rsvp_deadline)
  from public.rsvps r
  where r.wedding_id = w.id and r.edit_token_hash = p_token_hash and not r.is_archived;
end;
$$;

-- Switch Yes ↔ No (only before the deadline).
create or replace function public.rsvp_change(
  p_slug text,
  p_token_hash text,
  p_attending boolean,
  p_companions text[]
)
returns table (rsvp_id uuid, wedding_id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.weddings%rowtype := public.rsvp_open_wedding(p_slug);
  r public.rsvps%rowtype;
  companions text[] := coalesce(p_companions, '{}');
begin
  if w.rsvp_deadline is not null and now() > w.rsvp_deadline then
    raise exception 'RSVP_CLOSED';
  end if;

  select * into r from public.rsvps x
  where x.wedding_id = w.id and x.edit_token_hash = p_token_hash and not x.is_archived
  for update;
  if not found then
    raise exception 'RSVP_NOT_FOUND';
  end if;
  if r.attending = p_attending then
    raise exception 'NO_CHANGE';
  end if;
  if not p_attending and cardinality(companions) > 0 then
    raise exception 'INVALID_COMPANIONS';
  end if;
  if cardinality(companions) > w.max_companions then
    raise exception 'TOO_MANY_COMPANIONS';
  end if;

  -- The trigger deletes the companions when switching to "No".
  update public.rsvps set attending = p_attending, change_count = change_count + 1 where id = r.id;

  if p_attending then
    delete from public.rsvp_companions where rsvp_companions.rsvp_id = r.id;
    insert into public.rsvp_companions (rsvp_id, full_name, position)
    select r.id, trim(c.name), (c.ord - 1)::smallint
    from unnest(companions) with ordinality as c(name, ord);
  end if;

  return query select r.id, w.id, r.full_name;
end;
$$;

-- A single wish per answer.
create or replace function public.wish_submit(
  p_slug text,
  p_token_hash text,
  p_message text,
  p_locale text
)
returns table (wish_id uuid, wedding_id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.weddings%rowtype := public.rsvp_open_wedding(p_slug);
  r public.rsvps%rowtype;
  new_id uuid;
begin
  select * into r from public.rsvps x
  where x.wedding_id = w.id and x.edit_token_hash = p_token_hash and not x.is_archived;
  if not found then
    raise exception 'RSVP_NOT_FOUND';
  end if;
  if exists (select 1 from public.wishes x where x.rsvp_id = r.id) then
    raise exception 'WISH_EXISTS';
  end if;

  insert into public.wishes (rsvp_id, message, locale)
  values (r.id, trim(p_message), coalesce(p_locale, 'es'))
  returning id into new_id;

  return query select new_id, w.id, r.full_name;
end;
$$;

revoke all on function public.rsvp_open_wedding(text) from public, anon, authenticated;
revoke all on function public.rsvp_submit(text, text, boolean, text[], text, text, text) from public, anon, authenticated;
revoke all on function public.rsvp_status(text, text) from public, anon, authenticated;
revoke all on function public.rsvp_change(text, text, boolean, text[]) from public, anon, authenticated;
revoke all on function public.wish_submit(text, text, text, text) from public, anon, authenticated;

grant execute on function public.rsvp_open_wedding(text) to service_role;
grant execute on function public.rsvp_submit(text, text, boolean, text[], text, text, text) to service_role;
grant execute on function public.rsvp_status(text, text) to service_role;
grant execute on function public.rsvp_change(text, text, boolean, text[]) to service_role;
grant execute on function public.wish_submit(text, text, text, text) to service_role;
