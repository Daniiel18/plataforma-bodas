-- =====================================================================
-- Invitation background photo ("Tu foto" in Appearance).
-- One per wedding: the limits trigger already allows 1 for everything but the
-- gallery, and the Storage policies already cover the wedding's folder.
-- =====================================================================

alter type public.media_kind add value if not exists 'background';
