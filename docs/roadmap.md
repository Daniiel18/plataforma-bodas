# Roadmap

**Lazo de Oro** turns the platform into a self-service product: couples build their wedding website without an account, sign in to publish, and manage it from their own dashboard. It is free for every couple — with optional donations — and stays on free tiers ($0). The database is ready for paid plans if that ever changes.

## Stages

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Architecture and database: accounts, plans, wedding lifecycle, per-wedding settings, analytics, audit log | ✅ Done |
| 2 | Landing page, indexable demo, builder without an account (settings in the browser, photos and music in IndexedDB) | ✅ Done |
| 3 | Sign-in with Google or an email code, moving the browser draft to the database, publishing | ✅ Done |
| 4 | Couple's dashboard: companions mode, public guestbook, "Made with Lazo de Oro" credit, lifecycle jobs (read-only, archive, draft cleanup) | ✅ Done |
| 5 | Super admin: accounts, weddings, conversion funnel, free-tier usage, errors, audit log, suspensions | Next |
| 6 | Excel export of the guest list and a donations button | Planned |

## Decisions

- **No payments for now.** Vercel's Hobby plan does not allow requesting or processing payments; donations are allowed. Turning on paid plans later means Vercel Pro, a checkout (PayPal Advanced Checkout keeps every method in one PayPal balance) and an orders table.
- **Everything included** for every couple, with a small "Made with Lazo de Oro" credit.
- **No custom domain**: weddings live at `lazodeoro.vercel.app/<slug>`.
- **Market**: Hispanic couples in the US and Latin America, in Spanish and English.
- **Retention**: read-only 30 days after the event, archived 12 months after it; unpublished drafts are deleted after 30 days.

## Later

- Sign in with Apple (needs the Apple Developer Program).
- Moving media to a zero-egress store if the free Supabase bandwidth becomes the bottleneck.
- More gift options, more sections (accommodation, FAQ, story), guest list import.
