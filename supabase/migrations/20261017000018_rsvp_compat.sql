-- Keeps the previous RSVP signatures working while a deploy rolls out (the
-- running app calls them until the new version is live). They forward to the
-- new functions, with companions by name.

create function public.rsvp_reply(
  p_slug text,
  p_full_name text,
  p_attending boolean,
  p_companions text[],
  p_wish text,
  p_locale text,
  p_token_hash text,
  p_ip_hash text
)
returns table (rsvp_id uuid, wedding_id uuid)
language sql
security definer
set search_path = ''
as $$
  select * from public.rsvp_reply(
    p_slug, p_full_name, p_attending, p_companions, null::smallint, p_wish, p_locale, p_token_hash, p_ip_hash
  );
$$;

create function public.rsvp_change(p_slug text, p_token_hash text, p_attending boolean, p_companions text[])
returns table (rsvp_id uuid, wedding_id uuid, full_name text)
language sql
security definer
set search_path = ''
as $$
  select * from public.rsvp_change(p_slug, p_token_hash, p_attending, p_companions, null::smallint);
$$;

revoke all on function public.rsvp_reply(text, text, boolean, text[], text, text, text, text) from public, anon, authenticated;
revoke all on function public.rsvp_change(text, text, boolean, text[]) from public, anon, authenticated;
grant execute on function public.rsvp_reply(text, text, boolean, text[], text, text, text, text) to service_role;
grant execute on function public.rsvp_change(text, text, boolean, text[]) to service_role;
