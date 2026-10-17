# Operations

Day-to-day tasks for whoever runs the platform. Setup is covered in [deployment.md](deployment.md).

## Onboarding a couple

Couples onboard themselves: they design their invitation at `/crear`, sign in with Google or an emailed code, and it is published on the spot. The manual path below is for couples who need help.

1. **Create their account** in Supabase: **Authentication → Users → Add user**, with *Auto Confirm*. Send them the password through a private channel and ask them to change it from *¿Olvidaste tu contraseña?* on the login page.
2. **Create the wedding and link the account:**

   ```bash
   npm run wedding:create -- ana-y-luis "Ana López" "Luis Pérez"
   npm run admin:link -- couple@email.com ana-y-luis
   ```

3. The couple fills in everything from the dashboard — date, content, photos, music, gifts, template — previews it and publishes it from **Ajustes**, which opens the share dialog.
4. Suggest installing the dashboard on their phone (*Add to Home Screen*) and enabling notifications in **Ajustes**.

To give someone read-only access (a planner, a relative), link their account with `--viewer`.

## Back office

Platform admins manage everything at **/admin**. To give someone access, run in the SQL editor:

```sql
insert into public.platform_admins (user_id) select id from auth.users where email = 'person@example.com';
```

Turn on the admin notifications from the overview (*Avisos en este dispositivo*) to hear about new weddings and server errors. Suspend a wedding from its page in *Bodas* (a reason is required; it is reversible).

## Backups

The free Supabase plan does not include downloadable backups. Take a snapshot before every migration, before a couple publishes and after the wedding:

```bash
npm run db:backup              # tables as JSON + every uploaded file
npm run db:backup -- --no-files
```

Snapshots are written to `backups/<date>/` (git-ignored). They contain guests' names and private wishes: keep them encrypted or in private storage, never in the repository. Accounts live in Supabase Auth and are not part of the snapshot — recreate them with *Add user* and `admin:link`.

On Supabase Pro, daily backups (and optional point-in-time recovery) are automatic.

## Applying a database change

1. Write a new migration in `supabase/migrations/` (never edit an applied one) and test it inside a transaction that is rolled back.
2. `npm run db:backup`, then `npm run db:migrate`.
3. Rerun Supabase's **Security** and **Performance** advisors and fix any new finding.
4. Ship the code that depends on it. If the migration removes something the running app still uses, split it in two: add first, deploy, then remove in a later migration.

## Rotating secrets

| Secret | How | Side effects |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys: create a new secret key, update Vercel, redeploy, then delete the old key | None |
| `CRON_SECRET`, `IP_HASH_SALT` | Generate a new random value, update Vercel, redeploy | A new salt resets the RSVP rate-limit counters |
| `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys`, update both in Vercel, redeploy | Existing subscriptions stop working: the couple turns notifications on again in **Ajustes** |
| Database password | Supabase → Project Settings → Database → Reset password; update `DATABASE_URL` in `.env.local` | Only the local scripts use it |

Rotate immediately if a secret is ever pasted in a public place.

## Monitoring

| What | Where |
| --- | --- |
| Errors in Server Actions, RSVP failures, push errors | Vercel → Logs (filter by `error`) |
| Daily keep-alive | Vercel → Cron Jobs (last run must be `200`) |
| Database health, slow queries, advisors | Supabase → Advisors and Reports |
| Storage and database size vs. free limits | Supabase → Usage |
| Dependency and code security | GitHub → Security (Dependabot alerts, CodeQL) |

## Releases

1. Move the *Unreleased* notes in [CHANGELOG.md](../CHANGELOG.md) under a new version and bump `version` in `package.json` ([Semantic Versioning](https://semver.org/)).
2. Merge to `main`; Vercel promotes the build to production once CI passes.
3. Tag it: `git tag -a v1.2.0 -m "v1.2.0" && git push origin v1.2.0`, and publish the GitHub release with the changelog notes.

To roll back, open the previous deployment in Vercel and choose **Instant Rollback**. Database migrations are not rolled back automatically — write a new migration that reverts the change.

## Incident checklist

- **An invitation shows something wrong:** the couple can hide the section or unpublish from **Ajustes**; changes reach guests immediately.
- **Spam answers:** archive them from **Invitados**; close confirmations by setting a deadline. The database already rate-limits each connection.
- **A leaked secret:** rotate it (see above) and review Vercel and Supabase logs for its use.
- **Supabase paused** (if the keep-alive failed for a week): restore the project from the Supabase dashboard; data is kept.
