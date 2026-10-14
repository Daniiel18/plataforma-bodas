-- =====================================================================
-- Rol de solo lectura (cuenta demo pública).
--   owner  → administra la boda (los novios)
--   viewer → ve todo el panel, pero la base de datos rechaza cualquier cambio
-- =====================================================================

alter table public.wedding_members
  add column role text not null default 'owner' check (role in ('owner', 'viewer'));

create or replace function public.is_wedding_editor(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members m
    where m.wedding_id = p_wedding_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

revoke all on function public.is_wedding_editor(uuid) from public, anon;
grant execute on function public.is_wedding_editor(uuid) to authenticated, service_role;

-- Bodas: solo los dueños editan.
drop policy "Novios editan su boda" on public.weddings;
create policy "Novios editan su boda" on public.weddings
  for update to authenticated
  using (public.is_wedding_editor(id))
  with check (public.is_wedding_editor(id));

-- Tablas del panel: los miembros leen; solo los dueños escriben.
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('sections',          'Novios gestionan secciones'),
      ('media',             'Novios gestionan archivos'),
      ('gift_methods',      'Novios gestionan regalos'),
      ('rsvps',             'Novios gestionan RSVP'),
      ('rsvp_companions',   'Novios gestionan acompañantes'),
      ('wishes',            'Novios gestionan deseos'),
      ('wedding_private',   'Novios gestionan sus datos privados')
    ) as x(tbl, policy)
  loop
    execute format('drop policy %I on public.%I', t.policy, t.tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_wedding_member(wedding_id))',
      'Miembros leen ' || t.tbl, t.tbl);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_wedding_editor(wedding_id)) with check (public.is_wedding_editor(wedding_id))',
      'Dueños editan ' || t.tbl, t.tbl);
  end loop;
end;
$$;

-- Dispositivos para avisos: solo los dueños.
drop policy "Novios gestionan sus dispositivos" on public.push_subscriptions;
create policy "Dueños gestionan sus dispositivos" on public.push_subscriptions
  for all to authenticated
  using (public.is_wedding_editor(wedding_id))
  with check (public.is_wedding_editor(wedding_id));

-- Archivos: solo los dueños suben, cambian o borran.
create or replace function public.can_manage_storage_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members m
    where m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.wedding_id::text = (storage.foldername(object_name))[1]
  );
$$;
