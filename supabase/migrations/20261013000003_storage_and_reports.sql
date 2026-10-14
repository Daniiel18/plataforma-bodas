-- =====================================================================
-- Almacenamiento de archivos + funciones de reporte para el panel
-- =====================================================================

-- ---------------------------------------------------------------------
-- Bucket público de archivos (fotos, música, QR).
-- Ruta obligatoria: {wedding_id}/{tipo}/{archivo}
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-media',
  'wedding-media',
  true,
  15728640, -- 15 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg'
  ]
)
on conflict (id) do nothing;

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
      and m.wedding_id::text = (storage.foldername(object_name))[1]
  );
$$;

revoke all on function public.can_manage_storage_object(text) from public, anon;
grant execute on function public.can_manage_storage_object(text) to authenticated;

create policy "Novios suben archivos de su boda" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wedding-media' and public.can_manage_storage_object(name));

create policy "Novios ven archivos de su boda" on storage.objects
  for select to authenticated
  using (bucket_id = 'wedding-media' and public.can_manage_storage_object(name));

create policy "Novios actualizan archivos de su boda" on storage.objects
  for update to authenticated
  using (bucket_id = 'wedding-media' and public.can_manage_storage_object(name))
  with check (bucket_id = 'wedding-media' and public.can_manage_storage_object(name));

create policy "Novios borran archivos de su boda" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wedding-media' and public.can_manage_storage_object(name));

-- ---------------------------------------------------------------------
-- Reportes del panel (security invoker: respetan RLS del usuario)
-- ---------------------------------------------------------------------

create or replace function public.wedding_stats(p_wedding_id uuid)
returns table (
  responses       integer,
  attending       integer,
  declined        integer,
  companions      integer,
  total_people    integer,
  wishes          integer,
  unread_wishes   integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with active as (
    select r.id, r.attending
    from public.rsvps r
    where r.wedding_id = p_wedding_id and not r.is_archived
  ),
  comp as (
    select count(*)::integer as n
    from public.rsvp_companions c
    join active a on a.id = c.rsvp_id
    where a.attending
  )
  select
    (select count(*)::integer from active),
    (select count(*)::integer from active where attending),
    (select count(*)::integer from active where not attending),
    (select n from comp),
    (select count(*)::integer from active where attending) + (select n from comp),
    (select count(*)::integer from public.wishes w join active a on a.id = w.rsvp_id),
    (select count(*)::integer from public.wishes w join active a on a.id = w.rsvp_id where not w.is_read);
$$;

-- Posibles duplicados: compara titulares y acompañantes de respuestas
-- distintas (no archivadas) por similitud de nombre normalizado.
create or replace function public.rsvp_duplicate_matches(
  p_wedding_id uuid,
  p_threshold real default 0.6
)
returns table (
  rsvp_id          uuid,
  name             text,
  matched_rsvp_id  uuid,
  matched_name     text,
  score            real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with people as (
    select r.id as rsvp_id, r.full_name as name, r.name_normalized as norm
    from public.rsvps r
    where r.wedding_id = p_wedding_id and not r.is_archived
    union all
    select c.rsvp_id, c.full_name, c.name_normalized
    from public.rsvp_companions c
    join public.rsvps r on r.id = c.rsvp_id
    where r.wedding_id = p_wedding_id and not r.is_archived
  )
  select a.rsvp_id, a.name, b.rsvp_id, b.name, extensions.similarity(a.norm, b.norm)
  from people a
  join people b on a.rsvp_id <> b.rsvp_id
  where extensions.similarity(a.norm, b.norm) >= p_threshold
  order by a.rsvp_id, 5 desc;
$$;

revoke all on function public.wedding_stats(uuid) from public, anon;
revoke all on function public.rsvp_duplicate_matches(uuid, real) from public, anon;
grant execute on function public.wedding_stats(uuid) to authenticated, service_role;
grant execute on function public.rsvp_duplicate_matches(uuid, real) to authenticated, service_role;
