# Roadmap

The platform already serves one wedding end to end and the schema is multi-wedding from day one (every row hangs from `weddings`). These are the next steps toward a product that many couples can use on their own, roughly in order.

## Now — first couple

- [x] Guest invitation with templates, backgrounds, gallery, music, venue map, calendar and Zelle
- [x] Two-step reply with private wish, duplicate detection and deadline
- [x] Live dashboard, push notifications and share-on-publish
- [x] Hardened database (one policy per action, private helpers, indexed foreign keys)
- [ ] Couple's real account and first publication

## Next — more couples, still operated by hand

- **Staging environment**: a second Supabase project for Vercel previews.
- **Operator console** (`/ops`): list weddings, create one and invite the couple by email, instead of the CLI scripts.
- **Custom SMTP** for password recovery and invitations to the dashboard.
- **Guest list import** (CSV) and named invitation links that know how many companions each guest may bring.
- **More gift options**: bank transfer details, PayPal, a registry link.
- **More sections**: accommodation, FAQ, story timeline, livestream link.

## Later — self-service product

- **Sign-up and onboarding wizard** for couples, with a free preview and paid publication.
- **Payments** (Stripe) and plans; move to Vercel Pro and Supabase Pro.
- **Custom domains** per wedding (`anayluis.com`).
- **Template marketplace**: templates and backgrounds are already data (`src/lib/templates.ts`, `src/lib/backgrounds.ts`), so new collections can ship without code changes to the invitation.
- **More languages** beyond Spanish and English (the translation layer already stores per-field overrides).
- **Analytics for the couple**: invitation opens, replies over time.

## Ideas

- Seating plan with drag-and-drop tables.
- Shared photo album where guests upload pictures after the wedding.
- WhatsApp reminders before the reply deadline.
