-- =====================================================================
-- 1. Single reply: attendance, companions and the optional wish are saved
--    in one call, so the couple gets one notification with everything.
-- 2. Live dashboard: answers and wishes are published to Supabase
--    Realtime. Row Level Security still decides who receives each change.
-- =====================================================================

create or replace function public.rsvp_reply(
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  reply record;
  wish text := nullif(trim(coalesce(p_wish, '')), '');
begin
  select * into reply
  from public.rsvp_submit(p_slug, p_full_name, p_attending, p_companions, p_locale, p_token_hash, p_ip_hash);

  -- The trigger on wishes copies the wedding from the answer.
  if wish is not null then
    insert into public.wishes (rsvp_id, message, locale)
    values (reply.rsvp_id, wish, coalesce(p_locale, 'es'));
  end if;

  return query select reply.rsvp_id, reply.wedding_id;
end;
$$;

revoke all on function public.rsvp_reply(text, text, boolean, text[], text, text, text, text) from public, anon, authenticated;
grant execute on function public.rsvp_reply(text, text, boolean, text[], text, text, text, text) to service_role;

-- Old values in UPDATE events let the dashboard tell when a guest switched Yes/No.
alter table public.rsvps replica identity full;

alter publication supabase_realtime add table public.rsvps, public.wishes;
