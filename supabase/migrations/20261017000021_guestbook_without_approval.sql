-- The public guestbook shows every wish as soon as it arrives; the couple
-- hides the ones they don't want (wishes.is_hidden). approved_at stays,
-- unused, so nothing written before is lost.

create or replace function public.public_guestbook(p_wedding_id uuid)
returns table (author text, message text, locale text, approved_at timestamptz)
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
