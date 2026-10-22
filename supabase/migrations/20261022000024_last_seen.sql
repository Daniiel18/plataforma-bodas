-- profiles.last_seen_at (created with the platform foundation) is now written
-- by the server whenever an account opens its dashboard. The back office used
-- auth.users.last_sign_in_at instead, which only moves on a new sign-in, so a
-- couple who stays signed in kept showing the date of their first sign-in.

-- Start from the latest sign-in or session refresh each account already has.
update public.profiles p
set last_seen_at = greatest(
  p.last_seen_at,
  u.last_sign_in_at,
  (
    select max(greatest(s.refreshed_at at time zone 'utc', s.updated_at))
    from auth.sessions s
    where s.user_id = u.id
  )
)
from auth.users u
where u.id = p.id;
