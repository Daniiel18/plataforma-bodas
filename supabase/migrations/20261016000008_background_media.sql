-- =====================================================================
-- Foto de fondo de la invitación ("Tu foto" en Apariencia).
-- Una por boda: el trigger de límites ya permite 1 para todo lo que no es
-- galería, y las políticas de Storage ya cubren la carpeta de la boda.
-- =====================================================================

alter type public.media_kind add value if not exists 'background';
