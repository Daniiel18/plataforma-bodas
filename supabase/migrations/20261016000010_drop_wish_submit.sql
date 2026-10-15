-- =====================================================================
-- Wishes are now saved together with the answer (rsvp_reply), so the
-- separate wish function is no longer used.
-- =====================================================================

drop function if exists public.wish_submit(text, text, text, text);
