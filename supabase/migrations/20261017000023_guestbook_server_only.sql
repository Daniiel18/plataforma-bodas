-- The guestbook is read by the server while rendering the invitation, so the
-- function no longer needs to be callable by anonymous or signed-in clients.

revoke execute on function public.public_guestbook(uuid) from anon, authenticated;
grant execute on function public.public_guestbook(uuid) to service_role;
