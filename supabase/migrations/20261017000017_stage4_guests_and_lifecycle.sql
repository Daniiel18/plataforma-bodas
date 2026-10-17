-- =====================================================================
-- Stage 4
-- 1. Companions by count: weddings in "count" mode only ask how many
--    people come with each guest (rsvps.companions_count).
-- 2. Public guestbook with approval: the couple approves each wish before
--    it shows on the invitation (wishes.approved_at).
-- 3. Lifecycle notices: when the couple was warned that their wedding will
--    be archived or their draft deleted.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Companions by count
-- ---------------------------------------------------------------------

drop function public.rsvp_reply(text, text, boolean, text[], text, text, text, text);
drop function public.rsvp_submit(text, text, boolean, text[], text, text, text);
drop function public.rsvp_change(text, text, boolean, text[]);
drop function public.rsvp_status(text, text);

create function public.rsvp_submit(
  p_slug text,
  p_full_name text,
  p_attending boolean,
  p_companions text[],
  p_companions_count smallint,
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
  by_count boolean := w.companions_mode = 'count';
  companions text[] := case when by_count then '{}' else coalesce(p_companions, '{}') end;
  how_many integer := case when by_count then coalesce(p_companions_count, 0) else cardinality(companions) end;
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

  if how_many < 0 or (not p_attending and how_many > 0) then
    raise exception 'INVALID_COMPANIONS';
  end if;
  if how_many > w.max_companions then
    raise exception 'TOO_MANY_COMPANIONS';
  end if;

  insert into public.rsvps (wedding_id, full_name, attending, companions_count, locale, edit_token_hash, ip_hash)
  values (
    w.id, trim(p_full_name), p_attending, case when by_count then how_many end,
    coalesce(p_locale, 'es'), p_token_hash, p_ip_hash
  )
  returning id into new_id;

  insert into public.rsvp_companions (rsvp_id, full_name, position)
  select new_id, trim(c.name), (c.ord - 1)::smallint
  from unnest(companions) with ordinality as c(name, ord);

  return query select new_id, w.id;
end;
$$;

create function public.rsvp_reply(
  p_slug text,
  p_full_name text,
  p_attending boolean,
  p_companions text[],
  p_companions_count smallint,
  p_wish text,
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
  reply record;
  wish text := nullif(trim(coalesce(p_wish, '')), '');
begin
  select * into reply
  from public.rsvp_submit(
    p_slug, p_full_name, p_attending, p_companions, p_companions_count, p_locale, p_token_hash, p_ip_hash
  );

  -- The trigger on wishes copies the wedding from the answer.
  if wish is not null then
    insert into public.wishes (rsvp_id, message, locale)
    values (reply.rsvp_id, wish, coalesce(p_locale, 'es'));
  end if;

  return query select reply.rsvp_id, reply.wedding_id;
end;
$$;

-- Status of the guest's own answer (for returning visits by link or device).
create function public.rsvp_status(p_slug text, p_token_hash text)
returns table (
  rsvp_id uuid,
  full_name text,
  attending boolean,
  companions text[],
  companions_count integer,
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
    coalesce(r.companions_count::integer, (select count(*)::integer from public.rsvp_companions c where c.rsvp_id = r.id)),
    exists (select 1 from public.wishes x where x.rsvp_id = r.id),
    (w.rsvp_deadline is null or now() <= w.rsvp_deadline)
  from public.rsvps r
  where r.wedding_id = w.id and r.edit_token_hash = p_token_hash and not r.is_archived;
end;
$$;

-- Switch Yes <-> No (only before the deadline).
create function public.rsvp_change(
  p_slug text,
  p_token_hash text,
  p_attending boolean,
  p_companions text[],
  p_companions_count smallint
)
returns table (rsvp_id uuid, wedding_id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.weddings%rowtype := public.rsvp_open_wedding(p_slug);
  by_count boolean := w.companions_mode = 'count';
  companions text[] := case when by_count then '{}' else coalesce(p_companions, '{}') end;
  how_many integer := case when by_count then coalesce(p_companions_count, 0) else cardinality(companions) end;
  r public.rsvps%rowtype;
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
  if how_many < 0 or (not p_attending and how_many > 0) then
    raise exception 'INVALID_COMPANIONS';
  end if;
  if how_many > w.max_companions then
    raise exception 'TOO_MANY_COMPANIONS';
  end if;

  -- The trigger deletes the companions when switching to "No".
  update public.rsvps
  set attending = p_attending,
      companions_count = case when by_count then how_many end,
      change_count = change_count + 1
  where id = r.id;

  if p_attending then
    delete from public.rsvp_companions where rsvp_companions.rsvp_id = r.id;
    insert into public.rsvp_companions (rsvp_id, full_name, position)
    select r.id, trim(c.name), (c.ord - 1)::smallint
    from unnest(companions) with ordinality as c(name, ord);
  end if;

  return query select r.id, w.id, r.full_name;
end;
$$;

revoke all on function public.rsvp_submit(text, text, boolean, text[], smallint, text, text, text) from public, anon, authenticated;
revoke all on function public.rsvp_reply(text, text, boolean, text[], smallint, text, text, text, text) from public, anon, authenticated;
revoke all on function public.rsvp_status(text, text) from public, anon, authenticated;
revoke all on function public.rsvp_change(text, text, boolean, text[], smallint) from public, anon, authenticated;
grant execute on function public.rsvp_submit(text, text, boolean, text[], smallint, text, text, text) to service_role;
grant execute on function public.rsvp_reply(text, text, boolean, text[], smallint, text, text, text, text) to service_role;
grant execute on function public.rsvp_status(text, text) to service_role;
grant execute on function public.rsvp_change(text, text, boolean, text[], smallint) to service_role;

-- Companions counted by number add to the dashboard totals.
create or replace function public.wedding_stats(p_wedding_id uuid)
returns table (
  responses       integer,
  attending       integer,
  declined        integer,
  companions      integer,
  total_people    integer,
  wishes          integer,
  unread_wishes   integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with active as (
    select r.id, r.attending, r.companions_count
    from public.rsvps r
    where r.wedding_id = p_wedding_id and not r.is_archived
  ),
  comp as (
    select
      (select count(*)::integer
       from public.rsvp_companions c
       join active a on a.id = c.rsvp_id
       where a.attending and a.companions_count is null)
      + (select coalesce(sum(a.companions_count), 0)::integer from active a where a.attending) as n
  )
  select
    (select count(*)::integer from active),
    (select count(*)::integer from active where attending),
    (select count(*)::integer from active where not attending),
    (select n from comp),
    (select count(*)::integer from active where attending) + (select n from comp),
    (select count(*)::integer from public.wishes w join active a on a.id = w.rsvp_id),
    (select count(*)::integer from public.wishes w join active a on a.id = w.rsvp_id where not w.is_read);
$$;

-- ---------------------------------------------------------------------
-- 2. Public guestbook with approval
-- ---------------------------------------------------------------------

alter table public.wishes add column approved_at timestamptz;

-- Approved, visible wishes of a published wedding that shows its guestbook.
-- Anonymous visitors can call it: it only returns what the couple made public.
create function public.public_guestbook(p_wedding_id uuid)
returns table (author text, message text, locale text, approved_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.full_name, w.message, w.locale, w.approved_at
  from public.wishes w
  join public.rsvps r on r.id = w.rsvp_id
  join public.weddings wd on wd.id = w.wedding_id
  where w.wedding_id = p_wedding_id
    and wd.guestbook_public
    and wd.is_published
    and wd.status in ('active', 'read_only')
    and w.approved_at is not null
    and not w.is_hidden
    and not r.is_archived
  order by w.approved_at desc
  limit 100;
$$;

revoke all on function public.public_guestbook(uuid) from public;
grant execute on function public.public_guestbook(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Lifecycle notices
-- ---------------------------------------------------------------------

alter table public.weddings
  add column archive_notified_at timestamptz,
  add column draft_notified_at timestamptz;

create index if not exists weddings_lifecycle_idx on public.weddings (status, event_starts_at);
