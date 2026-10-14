# Deployment

The whole stack runs on free tiers: **Vercel Hobby** for the app and **Supabase Free** for the database, authentication and storage.

## 1. Supabase

1. Create a project (for example in `us-east-1`). Under **Project Settings → API Keys** copy the project URL, the **publishable** key and a **secret** key.
2. From **Connect → Session pooler**, copy the connection string (URL-encode special characters in the password, e.g. `@` → `%40`).
3. Fill in `.env.local` from [`.env.example`](../.env.example) and apply the schema:

   ```bash
   npm run db:migrate
   ```

4. Create a wedding and give the couple access. Create their user under **Authentication → Users → Add user** (with "Auto Confirm"), then:

   ```bash
   npm run wedding:create -- ana-y-luis "Ana López" "Luis Pérez"
   npm run admin:link -- couple@email.com ana-y-luis
   ```

5. Under **Authentication → URL Configuration**, set the **Site URL** to your production domain and add `https://<your-domain>/**` to the redirect URLs (used by password recovery).

## 2. Environment variables

| Variable | Scope | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Publishable key (safe in the browser thanks to RLS) |
| `SUPABASE_SECRET_KEY` | server | Secret key for RSVP functions and push delivery |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | public / server | Web Push keys — generate with `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | server | Contact URL for push services (your production URL) |
| `IP_HASH_SALT` | server | Random string used to hash IPs for rate limiting |
| `CRON_SECRET` | server | Random string; Vercel sends it to `/api/keep-alive` |
| `MYMEMORY_EMAIL` | server, optional | Raises the free translation quota from ~5k to ~50k characters/day |
| `DATABASE_URL` | local only | Used by the scripts in `scripts/`, never by the app |

## 3. Vercel

1. Import the GitHub repository (framework preset: Next.js).
2. Paste the variables above (Vercel accepts a whole `.env` block pasted into the first field).
3. Deploy. `vercel.json` registers a daily cron that calls `/api/keep-alive`, so the free Supabase project is never paused for inactivity.

Every push to `main` deploys to production; every pull request gets its own preview URL.

## 4. Public demo

```bash
npm run demo:seed            # fictional wedding at /demo with photos, music and texts
npm run demo:data -- demo    # sample guests and wishes for the dashboard
```

For a read-only dashboard demo, create a user in Supabase Auth and link it as a viewer:

```bash
npm run admin:link -- demo@your-domain.com demo --viewer
```

The `viewer` role can explore every screen, but the database and the Server Actions reject any change.

## Free tier budget

| Resource | Free limit | Typical wedding |
| --- | --- | --- |
| Supabase database | 500 MB | < 5 MB |
| Supabase storage | 1 GB | 30 compressed photos + 1 song ≈ 20 MB |
| Supabase egress | 5 GB / month | Images are cached by Vercel's CDN; music loads only after opening the envelope |
| Vercel bandwidth | 100 GB / month | Far below for a few hundred guests |

Note that Vercel Hobby is for personal, non-commercial use.
