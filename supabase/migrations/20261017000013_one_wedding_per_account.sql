-- =====================================================================
-- One wedding per account for now: the builder asks before replacing a
-- design instead of creating a second wedding. Raising the limit later is
-- a data change in plans.features, no code change.
-- =====================================================================

update public.plans
set features = jsonb_set(features, '{max_weddings}', '1')
where code = 'free';
