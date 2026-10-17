-- Housekeeping once everything runs on the current code:
-- 1. The previous RSVP signatures kept during the Stage 4 deploy.
-- 2. The wish approval step the platform no longer uses.

drop function if exists public.rsvp_reply(text, text, boolean, text[], text, text, text, text);
drop function if exists public.rsvp_change(text, text, boolean, text[]);

drop function public.public_guestbook(uuid);

create function public.public_guestbook(p_wedding_id uuid)
returns table (author text, message text, locale text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.full_name, w.message, w.locale, w.created_at
  from public.wishes w
  join public.rsvps r on r.id = w.rsvp_id
  join public.weddings wd on wd.id = w.wedding_id
  where w.wedding_id = p_wedding_id
    and wd.guestbook_public
    and wd.is_published
    and wd.status in ('active', 'read_only')
    and not w.is_hidden
    and not r.is_archived
  order by w.created_at desc
  limit 100;
$$;

revoke all on function public.public_guestbook(uuid) from public;
grant execute on function public.public_guestbook(uuid) to anon, authenticated, service_role;

alter table public.wishes drop column approved_at;
