# Security Policy

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through
[GitHub Security Advisories](https://github.com/Daniiel18/plataforma-bodas/security/advisories/new),
including steps to reproduce and the potential impact. You will get a first response within 72 hours.

## Security model

- **Row Level Security everywhere.** Guests (anonymous) can only read published invitations. They never read RSVPs, wishes or private settings. Policies use helper functions kept in a `private` schema that clients cannot call, and Supabase's security advisor reports no findings except leaked password protection (Pro plan only).
- **Guest writes go through the server.** RSVPs, answer changes and wishes are handled by Server Actions that call `SECURITY DEFINER` database functions executable only by the server role. Guests are identified by a random token; only its SHA-256 hash is stored.
- **Abuse protection.** Honeypot field, per-connection rate limit (salted, hashed IP), length limits and strict server-side validation with Zod.
- **Roles.** `owner` accounts can edit; `viewer` accounts (for example a planner or the demo account) are read-only, enforced both in the database and in every Server Action.
- **Secrets** (`SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY`, …) live only in server environment variables, marked sensitive and limited to production on Vercel. Nothing secret uses the `NEXT_PUBLIC_` prefix. Rotation steps are in [docs/operations.md](docs/operations.md#rotating-secrets).
- **Accounts** are created by the operator; the dashboard has no public sign-up.
- **Media** is uploaded straight to Supabase Storage under the wedding's folder; storage policies only let owners of that wedding write there.
- **HTTP headers**: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, and a strict policy for the service worker.

## Known advisories

| Package | Advisory | Status |
| --- | --- | --- |
| `braces` ≤ 3.0.3 (via `fast-glob`, used by ESLint and the shadcn CLI) | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Development tooling only, not part of the deployed app (`npm audit --omit=dev` reports 0 vulnerabilities). No patched release exists yet; Dependabot will pick it up automatically. |
