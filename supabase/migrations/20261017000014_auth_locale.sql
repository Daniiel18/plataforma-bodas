-- =====================================================================
-- Sign-in emails in one language: the templates read user_metadata.locale.
-- New accounts get it at sign-up; for existing ones the server stores the
-- language of the page before the email is sent. Server role only.
-- =====================================================================

create or replace function public.set_auth_locale(p_email text, p_locale text)
returns void
language sql
security definer
set search_path = ''
as $$
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('locale', p_locale)
  where lower(email) = lower(p_email)
    and p_locale in ('es', 'en');
$$;

revoke all on function public.set_auth_locale(text, text) from public, anon, authenticated;
grant execute on function public.set_auth_locale(text, text) to service_role;
