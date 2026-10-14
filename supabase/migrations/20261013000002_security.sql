-- =====================================================================
-- Seguridad: permisos explícitos + Row Level Security
-- El proyecto NO expone tablas automáticamente, así que todo permiso
-- se concede aquí de forma explícita.
--
-- Invitados (anon): solo leen contenido de bodas publicadas.
--   Nunca leen RSVP ni deseos. Sus envíos (Etapa 4) pasan por
--   funciones validadas en el servidor, no por acceso directo a tablas.
-- Novios (authenticated + miembro de la boda): control total de su boda.
-- =====================================================================

create or replace function public.is_wedding_member(p_wedding_id uuid)
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
  );
$$;

create or replace function public.is_published_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.weddings w where w.id = p_wedding_id and w.is_published
  );
$$;

-- ---------------------------------------------------------------------
-- Permisos de tabla
-- ---------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select on public.weddings, public.sections, public.media, public.gift_methods to anon;

grant select, insert, update, delete on
  public.weddings, public.sections, public.media, public.gift_methods,
  public.rsvps, public.rsvp_companions, public.wishes
  to authenticated;
grant select on public.wedding_members to authenticated;

grant all on all tables in schema public to service_role;

revoke all on function public.is_wedding_member(uuid) from public, anon;
revoke all on function public.is_published_wedding(uuid) from public;
grant execute on function public.is_wedding_member(uuid) to authenticated, service_role;
grant execute on function public.is_published_wedding(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.weddings        enable row level security;
alter table public.wedding_members enable row level security;
alter table public.sections        enable row level security;
alter table public.media           enable row level security;
alter table public.gift_methods    enable row level security;
alter table public.rsvps           enable row level security;
alter table public.rsvp_companions enable row level security;
alter table public.wishes          enable row level security;

-- Bodas: el público ve las publicadas; los novios ven y editan la suya.
-- Crear o borrar bodas solo lo hace el administrador de la plataforma (service_role).
create policy "Público ve bodas publicadas" on public.weddings
  for select to anon, authenticated
  using (is_published);

create policy "Novios ven su boda" on public.weddings
  for select to authenticated
  using (public.is_wedding_member(id));

create policy "Novios editan su boda" on public.weddings
  for update to authenticated
  using (public.is_wedding_member(id))
  with check (public.is_wedding_member(id));

create policy "Cada cuenta ve sus membresías" on public.wedding_members
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Contenido público (secciones, fotos/música/QR, regalos).
create policy "Público ve secciones visibles" on public.sections
  for select to anon, authenticated
  using (is_visible and public.is_published_wedding(wedding_id));

create policy "Novios gestionan secciones" on public.sections
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "Público ve archivos" on public.media
  for select to anon, authenticated
  using (public.is_published_wedding(wedding_id));

create policy "Novios gestionan archivos" on public.media
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "Público ve regalos visibles" on public.gift_methods
  for select to anon, authenticated
  using (is_visible and public.is_published_wedding(wedding_id));

create policy "Novios gestionan regalos" on public.gift_methods
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

-- Datos privados: solo los novios.
create policy "Novios gestionan RSVP" on public.rsvps
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "Novios gestionan acompañantes" on public.rsvp_companions
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "Novios gestionan deseos" on public.wishes
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));
