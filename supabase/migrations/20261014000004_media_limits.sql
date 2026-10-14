-- =====================================================================
-- Límites de archivos por boda:
--   galería: hasta 30 fotos · portada, canción, QR y vista previa: 1 cada uno
-- La app ya valida antes de subir; esto es la red de seguridad en la BD.
-- =====================================================================

create or replace function public.enforce_media_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_count integer;
  max_allowed integer := case new.kind when 'gallery' then 30 else 1 end;
begin
  -- Serializa altas concurrentes de la misma boda y tipo.
  perform pg_advisory_xact_lock(hashtext(new.wedding_id::text || new.kind::text));

  select count(*) into current_count
  from public.media m
  where m.wedding_id = new.wedding_id and m.kind = new.kind;

  if current_count >= max_allowed then
    raise exception 'Límite alcanzado: máximo % archivo(s) de tipo %', max_allowed, new.kind
      using errcode = 'check_violation';
  end if;

  if new.storage_path not like new.wedding_id::text || '/%' then
    raise exception 'La ruta del archivo no pertenece a esta boda'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger media_limits before insert on public.media
  for each row execute function public.enforce_media_limits();
