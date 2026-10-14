-- =====================================================================
-- Esquema base de la plataforma de bodas
-- Todas las tablas cuelgan de `weddings` para soportar varias bodas.
-- =====================================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------

-- Normaliza un nombre para comparar duplicados:
-- sin acentos, sin signos, minúsculas y con espacios simples.
create or replace function public.normalize_name(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(regexp_replace(
    regexp_replace(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, ''))),
      '[^a-z0-9 ]', ' ', 'g'),
    '\s+', ' ', 'g'));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------

create type public.section_type as enum (
  'intro',        -- sobre con botón "Abrir"
  'hero',         -- portada con foto y nombres
  'parents',      -- padres de los novios
  'celebration',  -- fecha, hora, cuenta regresiva y calendario
  'gallery',      -- carrusel 3D
  'location',     -- lugar + mapa + cómo llegar
  'dress_code',
  'program',      -- programa del día
  'rsvp',
  'gifts',        -- caja de regalos / Zelle
  'music'         -- configuración del reproductor
);

create type public.media_kind as enum ('gallery', 'cover', 'audio', 'qr', 'og');

create type public.gift_type as enum ('zelle');

-- ---------------------------------------------------------------------
-- Bodas
-- ---------------------------------------------------------------------

create table public.weddings (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  partner1_name    text not null check (char_length(trim(partner1_name)) between 1 and 80),
  partner2_name    text not null check (char_length(trim(partner2_name)) between 1 and 80),
  -- Fecha y zona horaria las define la novia desde el panel.
  event_starts_at  timestamptz,
  timezone         text,
  rsvp_deadline    timestamptz,
  max_companions   smallint not null default 10 check (max_companions between 0 and 50),
  notify_email     text check (notify_email is null or notify_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  template_key     text not null default 'champagne-clasico',
  theme_overrides  jsonb not null default '{}'::jsonb,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger weddings_updated_at before update on public.weddings
  for each row execute function public.set_updated_at();

-- Cuenta(s) que administran cada boda (hoy: una cuenta compartida por los novios).
create table public.wedding_members (
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

create index wedding_members_user_idx on public.wedding_members (user_id);

-- ---------------------------------------------------------------------
-- Contenido de la invitación
-- ---------------------------------------------------------------------

-- `content` guarda los textos en español y los ajustes de la sección.
-- `content_en` guarda la traducción al inglés (automática o corregida).
create table public.sections (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  type        public.section_type not null,
  position    smallint not null default 0,
  is_visible  boolean not null default true,
  content     jsonb not null default '{}'::jsonb,
  content_en  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (wedding_id, type)
);

create trigger sections_updated_at before update on public.sections
  for each row execute function public.set_updated_at();

create table public.media (
  id                uuid primary key default gen_random_uuid(),
  wedding_id        uuid not null references public.weddings(id) on delete cascade,
  kind              public.media_kind not null,
  storage_path      text not null unique,
  mime_type         text not null,
  size_bytes        integer not null check (size_bytes > 0),
  width             integer,
  height            integer,
  duration_seconds  numeric(8, 2),
  caption           text,
  caption_en        text,
  position          integer not null default 0,
  created_at        timestamptz not null default now()
);

create index media_wedding_kind_idx on public.media (wedding_id, kind, position);

create table public.gift_methods (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  type         public.gift_type not null default 'zelle',
  holder_name  text,
  handle       text,  -- email o teléfono registrado en Zelle
  qr_media_id  uuid references public.media(id) on delete set null,
  note         text,
  note_en      text,
  position     smallint not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index gift_methods_wedding_idx on public.gift_methods (wedding_id, position);

create trigger gift_methods_updated_at before update on public.gift_methods
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RSVP, acompañantes y deseos
-- ---------------------------------------------------------------------

create table public.rsvps (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid not null references public.weddings(id) on delete cascade,
  full_name        text not null check (char_length(trim(full_name)) between 2 and 120),
  name_normalized  text generated always as (public.normalize_name(full_name)) stored,
  attending        boolean not null,
  locale           text not null default 'es' check (locale in ('es', 'en')),
  -- Hash del enlace personal con el que el invitado puede cambiar Sí/No.
  -- Nulo si la respuesta la creó la novia desde el panel.
  edit_token_hash  text unique,
  change_count     integer not null default 0,
  admin_note       text,
  is_archived      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index rsvps_wedding_created_idx on public.rsvps (wedding_id, created_at desc);
create index rsvps_name_trgm_idx on public.rsvps using gin (name_normalized extensions.gin_trgm_ops);

create trigger rsvps_updated_at before update on public.rsvps
  for each row execute function public.set_updated_at();

create table public.rsvp_companions (
  id               uuid primary key default gen_random_uuid(),
  rsvp_id          uuid not null references public.rsvps(id) on delete cascade,
  wedding_id       uuid not null references public.weddings(id) on delete cascade,
  full_name        text not null check (char_length(trim(full_name)) between 2 and 120),
  name_normalized  text generated always as (public.normalize_name(full_name)) stored,
  position         smallint not null default 0,
  created_at       timestamptz not null default now()
);

create index rsvp_companions_rsvp_idx on public.rsvp_companions (rsvp_id, position);
create index rsvp_companions_name_trgm_idx on public.rsvp_companions using gin (name_normalized extensions.gin_trgm_ops);

-- Un solo deseo por respuesta; el nombre del autor sale del RSVP.
create table public.wishes (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  rsvp_id     uuid not null unique references public.rsvps(id) on delete cascade,
  message     text not null check (char_length(trim(message)) between 1 and 1000),
  locale      text not null default 'es' check (locale in ('es', 'en')),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index wishes_wedding_created_idx on public.wishes (wedding_id, created_at desc);

-- ---------------------------------------------------------------------
-- Reglas de integridad del RSVP
-- ---------------------------------------------------------------------

-- Acompañantes: heredan la boda del RSVP, solo si asiste y sin pasar el máximo.
create or replace function public.enforce_companion_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent public.rsvps%rowtype;
  max_allowed smallint;
  current_count integer;
begin
  select * into parent from public.rsvps where id = new.rsvp_id;
  if not found then
    raise exception 'RSVP % no existe', new.rsvp_id;
  end if;
  if not parent.attending then
    raise exception 'No se pueden agregar acompañantes a una respuesta que no asiste';
  end if;

  new.wedding_id := parent.wedding_id;

  select w.max_companions into max_allowed from public.weddings w where w.id = parent.wedding_id;
  select count(*) into current_count from public.rsvp_companions c where c.rsvp_id = new.rsvp_id;
  if current_count >= max_allowed then
    raise exception 'Máximo de % acompañantes por respuesta', max_allowed;
  end if;

  return new;
end;
$$;

create trigger rsvp_companions_rules before insert on public.rsvp_companions
  for each row execute function public.enforce_companion_rules();

-- Si una respuesta pasa a "No asiste", se eliminan sus acompañantes.
create or replace function public.clear_companions_when_declined()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.attending and not new.attending then
    delete from public.rsvp_companions where rsvp_id = new.id;
  end if;
  return new;
end;
$$;

create trigger rsvps_clear_companions after update of attending on public.rsvps
  for each row execute function public.clear_companions_when_declined();

-- Los deseos heredan la boda del RSVP.
create or replace function public.set_wish_wedding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select r.wedding_id into new.wedding_id from public.rsvps r where r.id = new.rsvp_id;
  return new;
end;
$$;

create trigger wishes_set_wedding before insert on public.wishes
  for each row execute function public.set_wish_wedding();
