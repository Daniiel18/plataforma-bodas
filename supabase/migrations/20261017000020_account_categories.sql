-- Accounts used for testing don't count in the back office's numbers, and
-- platform admin accounts never own or manage weddings.

alter table public.profiles add column is_test boolean not null default false;

create or replace function private.members_not_platform_admins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.platform_admins a where a.user_id = new.user_id) then
    raise exception 'ADMIN_CANNOT_OWN_WEDDINGS' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.members_not_platform_admins() from public, anon, authenticated;

create trigger wedding_members_not_platform_admins
  before insert or update on public.wedding_members
  for each row execute function private.members_not_platform_admins();

-- Test accounts chosen by the platform owner, and the admin account's wedding link removed.
update public.profiles p set is_test = true
from auth.users u
where u.id = p.id and u.email in ('prueba@test.com', 'demo@plataforma-bodas.app');

delete from public.wedding_members m
using public.platform_admins a
where a.user_id = m.user_id;
