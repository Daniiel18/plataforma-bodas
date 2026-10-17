-- =====================================================================
-- More ways to give: PayPal, bank transfer and gift registries, besides
-- Zelle. One row per method and wedding; each couple turns on the ones
-- they want (is_visible). Method-specific fields live in `details`:
--   bank:     { bank, account, accountType, routing }
--   registry: { links: [{ store, url }] }   (up to 3)
-- =====================================================================

alter type public.gift_type add value if not exists 'paypal';
alter type public.gift_type add value if not exists 'bank';
alter type public.gift_type add value if not exists 'registry';

alter table public.gift_methods
  add column details jsonb not null default '{}'
    check (jsonb_typeof(details) = 'object' and pg_column_size(details) < 4096);

create unique index gift_methods_wedding_type_key on public.gift_methods (wedding_id, type);

-- The platform's own name can never be a wedding link.
create or replace function private.is_reserved_slug(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_slug = any (array[
    'admin', 'panel', 'crear', 'entrar', 'salir', 'cuenta', 'login', 'registro',
    'api', 'auth', 'app', 'www', 'static', 'media', 'icons', 'sw', 'manifest',
    'sitemap', 'robots', 'favicon', 'plantillas', 'precios', 'donar', 'ayuda',
    'soporte', 'legal', 'terminos', 'privacidad', 'blog', 'vista-previa',
    'ejemplo', 'boda', 'bodas', 'invitacion', 'invitaciones', 'lazodoro', 'lazodeoro', 'lazo-de-oro'
  ]);
$$;
