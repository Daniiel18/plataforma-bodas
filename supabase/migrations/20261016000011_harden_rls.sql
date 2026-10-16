-- =====================================================================
-- Hardening after Supabase's security and performance advisors.
-- Who can do what does not change: owners write, members read, and the
-- public only sees published content.
--
-- 1. The RLS helper functions move to the `private` schema, which the Data
--    API does not expose, so they can no longer be called as RPCs. Policies
--    reference functions by OID, so they keep working; anon/authenticated
--    only need USAGE on the schema to evaluate them (no table in `private`
--    is granted to them).
-- 2. One permissive policy per table, role and action: the owners' ALL
--    policies are split into INSERT/UPDATE/DELETE, and the public and
--    member reads are merged, so each query evaluates a single policy.
-- 3. Indexes for the foreign keys that lacked one.
-- =====================================================================

-- 1. Helpers out of the public API ------------------------------------
alter function public.is_wedding_member(uuid) set schema private;
alter function public.is_wedding_editor(uuid) set schema private;
alter function public.is_published_wedding(uuid) set schema private;
alter function public.can_manage_storage_object(text) set schema private;

grant usage on schema private to anon, authenticated;
-- USAGE is only for the helpers: no table in `private` (e.g. schema_migrations) is readable.
revoke all on all tables in schema private from anon, authenticated;
alter default privileges in schema private revoke all on tables from anon, authenticated;

-- Supabase's "enable RLS on new tables" event trigger function: it runs as
-- an event trigger, nobody needs to call it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 2. One policy per action ---------------------------------------------

-- weddings: public reads published weddings, members read their own.
drop policy "Público ve bodas publicadas" on public.weddings;
drop policy "Novios ven su boda" on public.weddings;
create policy "Public reads published weddings" on public.weddings
  for select to anon using (is_published);
create policy "Members read their wedding or published ones" on public.weddings
  for select to authenticated using (is_published or private.is_wedding_member(id));
alter policy "Novios editan su boda" on public.weddings rename to "Owners update their wedding";

-- Content the public sees once published, members always, owners edit.
drop policy "Público ve secciones visibles" on public.sections;
drop policy "Miembros leen sections" on public.sections;
drop policy "Dueños editan sections" on public.sections;
create policy "Public reads visible sections" on public.sections
  for select to anon using (is_visible and private.is_published_wedding(wedding_id));
create policy "Members read sections" on public.sections
  for select to authenticated
  using (private.is_wedding_member(wedding_id) or (is_visible and private.is_published_wedding(wedding_id)));

drop policy "Público ve archivos" on public.media;
drop policy "Miembros leen media" on public.media;
drop policy "Dueños editan media" on public.media;
create policy "Public reads media of published weddings" on public.media
  for select to anon using (private.is_published_wedding(wedding_id));
create policy "Members read media" on public.media
  for select to authenticated
  using (private.is_wedding_member(wedding_id) or private.is_published_wedding(wedding_id));

drop policy "Público ve regalos visibles" on public.gift_methods;
drop policy "Miembros leen gift_methods" on public.gift_methods;
drop policy "Dueños editan gift_methods" on public.gift_methods;
create policy "Public reads visible gifts" on public.gift_methods
  for select to anon using (is_visible and private.is_published_wedding(wedding_id));
create policy "Members read gifts" on public.gift_methods
  for select to authenticated
  using (private.is_wedding_member(wedding_id) or (is_visible and private.is_published_wedding(wedding_id)));

-- Private data: members read, owners write.
drop policy "Miembros leen rsvps" on public.rsvps;
drop policy "Dueños editan rsvps" on public.rsvps;
create policy "Members read rsvps" on public.rsvps
  for select to authenticated using (private.is_wedding_member(wedding_id));

drop policy "Miembros leen rsvp_companions" on public.rsvp_companions;
drop policy "Dueños editan rsvp_companions" on public.rsvp_companions;
create policy "Members read companions" on public.rsvp_companions
  for select to authenticated using (private.is_wedding_member(wedding_id));

drop policy "Miembros leen wishes" on public.wishes;
drop policy "Dueños editan wishes" on public.wishes;
create policy "Members read wishes" on public.wishes
  for select to authenticated using (private.is_wedding_member(wedding_id));

drop policy "Miembros leen wedding_private" on public.wedding_private;
drop policy "Dueños editan wedding_private" on public.wedding_private;
create policy "Members read private settings" on public.wedding_private
  for select to authenticated using (private.is_wedding_member(wedding_id));

-- Owners' writes, one policy per action, on every table that had an ALL policy.
do $$
declare
  t text;
begin
  foreach t in array array['sections', 'media', 'gift_methods', 'rsvps', 'rsvp_companions', 'wishes', 'wedding_private']
  loop
    execute format(
      'create policy "Owners insert %1$s" on public.%1$I for insert to authenticated
         with check (private.is_wedding_editor(wedding_id))', t);
    execute format(
      'create policy "Owners update %1$s" on public.%1$I for update to authenticated
         using (private.is_wedding_editor(wedding_id)) with check (private.is_wedding_editor(wedding_id))', t);
    execute format(
      'create policy "Owners delete %1$s" on public.%1$I for delete to authenticated
         using (private.is_wedding_editor(wedding_id))', t);
  end loop;
end;
$$;

-- English names for the policies that stay as they were (storage.objects
-- belongs to Supabase's storage role, so its policies keep their names).
alter policy "Dueños gestionan sus dispositivos" on public.push_subscriptions rename to "Owners manage their devices";
alter policy "Cada cuenta ve sus membresías" on public.wedding_members rename to "Accounts read their memberships";

-- 3. Covering indexes for foreign keys ---------------------------------
create index if not exists gift_methods_qr_media_idx on public.gift_methods (qr_media_id);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
create index if not exists rsvp_companions_wedding_idx on public.rsvp_companions (wedding_id);
