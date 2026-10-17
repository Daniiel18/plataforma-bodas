# Deployment

The whole stack runs on free tiers: **Vercel Hobby** for the app and **Supabase Free** for the database, authentication and storage.

## 1. Supabase

1. Create a project (for example in `us-east-1`). Under **Project Settings → API Keys** copy the project URL, the **publishable** key and a **secret** key.
2. From **Connect → Session pooler**, copy the connection string (URL-encode special characters in the password, e.g. `@` → `%40`).
3. Fill in `.env.local` from [`.env.example`](../.env.example) and apply the schema:

   ```bash
   npm run db:migrate
   ```

4. Couples create their account by signing in at `/entrar` and their wedding by publishing from `/crear`. To set one up by hand, create the user under **Authentication → Users → Add user** (with "Auto Confirm"), then:

   ```bash
   npm run wedding:create -- ana-y-luis "Ana López" "Luis Pérez"
   npm run admin:link -- couple@email.com ana-y-luis
   ```

5. Under **Authentication → URL Configuration**, set the **Site URL** to your production domain and add `https://<your-domain>/**` to the redirect URLs (used by sign-in links and password recovery). Add `http://localhost:3000/**` too if you develop against the same project.

### Supabase settings

| Setting | Where | Recommended |
| --- | --- | --- |
| Allow new users to sign up | Authentication → Sign In / Providers | **On** — couples create their account the first time they sign in |
| Google | Authentication → Sign In / Providers → Google | On, with the client ID and secret from [Google sign-in](#google-sign-in) |
| Email OTP length | Authentication → Sign In / Providers → Email | **6** digits |
| Email templates | Authentication → Emails → *Confirm sign up* and *Magic link* | Subject and body branch on the language: `{{ if eq (printf "%v" .Data.locale) "en" }}…{{ else }}…{{ end }}`. Show `{{ .Token }}` and link to `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email` |
| Confirm email | Authentication → Sign In / Providers | On |
| Minimum password length | Authentication → Sign In / Providers → Email | **8** or more, with letters and digits required |
| Secure email change | Authentication → Sign In / Providers → Email | On |
| Leaked password protection | Authentication → Attack Protection | Pro plan only; enable it when upgrading |
| Custom SMTP | Authentication → Emails | **Required**: the built-in mailer sends only a few emails per hour. A Gmail account of the brand with an app password works for launch (about 500 emails a day) |
| Bucket `wedding-media` | Storage | Public read, 15 MB per file, images and audio only (set by the migrations) |
| Advisors | Advisors → Security / Performance | Rerun after every migration; the only expected warning is leaked password protection |

### Google sign-in

In [Google Cloud](https://console.cloud.google.com) → **Google Auth Platform**:

1. **Branding:** app name *Lazo de Oro*, the 120×120 logo, support email, home page, privacy policy (`/privacidad`) and terms (`/terminos`) on the production domain, which also goes under *Authorized domains*.
2. **Audience:** External and *In production*. Only the basic scopes (`openid`, `email`, `profile`) are used, so no app review is needed.
3. **Clients → Web application:** add every production domain and `http://localhost:3000` to *Authorized JavaScript origins* (the button only works on these origins). No redirect URI is needed, so the Supabase domain stays out of *Authorized domains*. Paste the client ID and secret into Supabase's Google provider; the client ID is public and also lives in `src/lib/site.ts`.
4. **Brand verification:** verify every authorized domain in Google Search Console (the site already serves the `google-site-verification` tag from `src/app/layout.tsx`) and press *Verify branding*. Until Google approves it, the consent screen shows the domain instead of the app name and logo.

## 2. Environment variables

| Variable | Scope | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Publishable key (safe in the browser thanks to RLS) |
| `SUPABASE_SECRET_KEY` | server | Secret key for RSVP functions and push delivery |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | public / server | Web Push keys — generate with `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | server | Contact URL for push services (your production URL) |
| `NEXT_PUBLIC_DONATE_URL` | public, optional | PayPal.me link for voluntary donations (defaults to the one in `src/lib/site.ts`) |
| `NEXT_PUBLIC_SITE_URL` | public, optional | Canonical URL for links, sitemap and share messages (defaults to `https://lazodeoro.vercel.app`) |
| `IP_HASH_SALT` | server | Random string used to hash IPs for rate limiting |
| `CRON_SECRET` | server | Random string; Vercel sends it to `/api/keep-alive` |
| `MYMEMORY_EMAIL` | server, optional | Raises the free translation quota from ~5k to ~50k characters/day |
| `DATABASE_URL` | local only | Used by the scripts in `scripts/`, never by the app |

On Vercel, mark every variable as **Sensitive**, and limit the server-only secrets (`SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY`, `IP_HASH_SALT`, `CRON_SECRET`) to the **Production** environment. Preview deployments then build and render normally but cannot write to the production database or send notifications — the code only reads those secrets when they are used, and CI builds without them too.

## 3. Vercel

1. Import the GitHub repository (framework preset: Next.js).
2. Paste the variables above (Vercel accepts a whole `.env` block pasted into the first field).
3. Deploy. `vercel.json` registers a daily cron that calls `/api/keep-alive`, so the free Supabase project is never paused for inactivity.

Every push to `main` deploys to production; every pull request gets its own preview URL.

### Recommended project settings

| Setting | Where | Value | Why |
| --- | --- | --- | --- |
| Node.js version | Settings → Build and Deployment | 24.x | Matches `.nvmrc` and CI |
| Function region | Settings → Functions | `iad1` (Washington, D.C.) | Next to Supabase `us-east-1`, so every query is a short hop |
| Fluid compute | Settings → Functions | On | Fewer cold starts; Server Actions share warm instances |
| Deployment Checks | Settings → Deployment Checks | GitHub check *Lint, types, tests & build* | Production is only promoted after CI passes |
| Deployment Protection | Settings → Deployment Protection | Standard (Vercel Authentication) | Preview URLs are private; production stays public |
| Protect sourcemaps | Settings → Deployment Protection | On | Source maps are not public |
| Cron jobs | Settings → Cron Jobs | `/api/keep-alive` daily at 12:00 UTC and `/api/cron/lifecycle` daily at 09:00 UTC | Keep the free Supabase project awake and apply the wedding lifecycle; both answer `401` without `CRON_SECRET` |

For a team or a commercial launch, add a **separate Supabase project for previews** (staging) and point the Preview environment variables to it, so pull requests can be tested end to end without touching real weddings.

## 4. Public demo

```bash
npm run demo:seed            # fictional wedding at /demo with photos, music and texts
npm run demo:data -- demo    # sample guests and wishes for the dashboard
```

For a read-only dashboard demo, create a user in Supabase Auth, link it as a viewer and mark it as a test account in the back office (*Cuentas*), where you can also set its password. Keep its credentials private:

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
| OpenStreetMap tiles + Nominatim | Fair use (≈ 1 search / second) | A handful of searches when the couple sets the venue |

Note that Vercel Hobby is for personal, non-commercial use: move to **Vercel Pro** and **Supabase Pro** (daily backups, no pausing, leaked password protection) before charging couples. Day-to-day operations are covered in [operations.md](operations.md).
