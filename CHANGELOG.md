# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Sign-in** (`/entrar`) with Google or a 6-digit code (plus a link) sent by email; the account is created on the first sign-in. Google's consent screen shows *Lazo de Oro*, and the email arrives in the language of the page.
- **Publish from the builder**: after signing in, the draft becomes the couple's wedding — photos, music and QR uploaded from the device, texts translated to English — and the share dialog opens. One wedding per account; if there is one already, the couple can replace its design and keep their guests' replies.
- **Song library**: five public domain recordings by United States Air Force bands (Canon in D, Air, Clair de Lune, Amazing Grace, Ave Maria) to pick with a preview in the builder and the dashboard, for couples without their own MP3; uploading their own song makes it the one that plays. Served from `/public/music`, so they cost no Storage bandwidth.
- **Adjust every photo**: *Ajustar* on the cover, each gallery photo and the background photo (dashboard and builder) opens the photo in its real frame to drag it and zoom with a slider, two fingers or the wheel — down to the whole photo over a blurred copy of itself. The framing adapts to each carousel style and screen.
- **Save without publishing**: *Guardar en mi cuenta* in the builder (any step, once names and date are in) keeps the invitation in the couple's account as an unpublished draft, so they can go on from any phone or computer in the dashboard, which reminds them it is not published yet.
- **More gift methods**: PayPal.me, bank transfer (with copy buttons) and gift-registry links next to Zelle. Each couple turns on the ones they want, in the builder and in the dashboard, which also gets a switch to show or hide the whole gift box.
- **Lazo de Oro platform site**: landing page (live demo in a phone, how it works, FAQ), privacy policy and terms in Spanish and English, original gold-bow logo and app icons, sitemap, robots and link previews.
- **One indexable demo per template** (`/demo/<template>`) with a *Create yours with this template* bar.
- **Builder without an account** (`/crear`): a 14-step guide with live previews, example texts, photos and music kept on the device, venue map, link availability check and a full-size preview.
- **Product analytics** without cookies (`/api/events`), respecting *Do Not Track*.
- More Latin American time zones.
- **Platform foundation (Lazo de Oro)**: account profiles created on sign-up, platform administrators, plans (a free plan with every feature, ready for paid plans), product analytics and an audit log.
- **Wedding lifecycle** enforced by the database: draft → active on first publish → read-only 30 days after the event → archived, plus suspension by the platform. Guests only see active or read-only weddings, replies close outside draft/active, and couples cannot change the lifecycle themselves.
- Per-wedding settings for **companions** (names or just a number) and a **public guestbook** (private by default) with hideable wishes.
- Reserved slugs and a per-plan limit of live weddings per account.

### Changed

- The couple's dashboard moved from `/admin` to `/panel` (old links redirect, and the installable app now lives under `/panel`).
- The platform's address is now **lazodeoro.vercel.app**.
- The publishing screen no longer mentions the translation.
- The section forms, venue map and template pickers are shared between the dashboard and the builder (`src/components/editor`), and the invitation is assembled by one function for both the public page and the builder.
- Live previews keep showing a family or an activity while it is still being typed.

### Fixed

- The music kept playing after leaving an invitation, and could not be paused after going from a demo to the builder.
- Some phone photos (HEIC, very large, or without a file type) could not be used as the cover: the builder now tries a second decoder and says what to do when a photo cannot be read or the browser does not allow saving files (private mode).

## [1.1.0] — 2026-10-15

### Added

- **Venue picker**: the content editor shows a map (OpenStreetMap) where the couple searches the address and drags the pin to the exact entrance. The guest's map, *Get directions* and the calendar event (`GEO`) use that point; without one, the written address is used.
- **Backups**: `npm run db:backup` saves every table and uploaded file under `backups/`.
- **Documentation**: [operations guide](docs/operations.md) (onboarding, backups, key rotation, monitoring, releases, incidents), [roadmap](docs/roadmap.md), recommended Vercel and Supabase settings in the [deployment guide](docs/deployment.md).
- **Single reply with wish**: the form asks for attendance and companions, then the optional wish, and saves everything in one transaction (`rsvp_reply`), so the couple gets one notification with the wish included.
- **Live dashboard** with Supabase Realtime: new answers and wishes appear as in-app notifications and pages update without reloading.
- **Share dialog** right after publishing (and from the overview): link, ready-made invitation message with optional English version, and one-tap sharing to Messages/iMessage, WhatsApp, Messenger, Telegram, Facebook, email and the native share sheet.
- **Zelle**: *Send with Zelle* button that opens Zelle with the couple as recipient, and *Save QR* to the photo library.
- **Content previews**: every section in the content editor shows how it looks in the chosen template, live while typing.

- **Template engine**: templates are now data (palette, fonts, ornaments, photo frame, card and button styles) rendered through CSS variables, so a new template is a single catalog entry.
- **11 new templates** (14 in total) in seven collections, inspired by champagne, ivory, cream, warm beige and soft-gold palettes: Champagne & Ivory, Romantic Beige, Champagne Satin, Art Déco Champagne, Candlelight, White & Gold, Sage Garden, Dusty Rose, Rustic Pampas, Burgundy & Champagne and the dark Champagne Night.
- **14 page backgrounds** that work with any template — plain, cotton paper, linen, satin, watercolor, marble, bokeh, damask, lace, art déco, botanical, polka dots, pinstripes — and **"Your photo"**, with three veil strengths so text stays readable.
- Original SVG ornaments: rose cluster, baby's breath, eucalyptus, pampas grass, art déco fan, laurel and satin bow.
- Redesigned **Appearance** page with collection filters, background picker, live preview and an unsaved-changes bar.

### Changed

- **Content previews** are shown only for the sections guests see; gallery, gifts and music — managed on their own pages — are just ordered and shown/hidden in the content editor.
- **Add to calendar** is now a single button that opens the right calendar for the guest's device (Apple Calendar on iPhone, Google Calendar on Android, an `.ics` file on computers) instead of a menu.
- Unknown or unpublished invitation URLs now answer with a real **404** status: published invitations are prerendered at build time and Partial Prefetching is off, so the page checks the invitation before streaming.
- The 3D gallery mounts its carousel on the guest's device and shows the first photo until then, so invitations can be fully prerendered.
- Every code comment is now in English.
- The template comes first in the dashboard menu (renamed *Plantilla*), and the content editor no longer repeats links to the Gallery, Gifts and Music pages.
- **Get directions** is now a single button: Android opens the system's map app chooser, iPhone shows a native-style sheet with Apple Maps, Google Maps and Waze, and computers open Google Maps.

### Security

- Supabase's security and performance advisors are clean: the RLS helper functions moved to a `private` schema that the Data API does not expose, every table has one permissive policy per role and action (same permissions as before), the event-trigger function `rls_auto_enable` can no longer be called by clients, and every foreign key is indexed.
- Server-only secrets on Vercel are limited to the Production environment, and production is promoted only after CI passes (Deployment Checks).

## [1.0.0] — 2026-10-15

### Added

- **Guest invitation** at `/<slug>`: animated envelope that starts the music, polaroid cover, parents, countdown, month calendar with add-to-calendar (iPhone `.ics`, Google, Outlook), 3D photo gallery (coverflow, cube, cards, flip, ring), venue map with Apple Maps / Google Maps / Waze directions, dress code, schedule and an animated gift box with a Zelle QR.
- **Bilingual experience** (Spanish / English), chosen from the phone's language, with a flicker-free toggle. Content written in Spanish is machine-translated on save and can be corrected by hand.
- **RSVP flow**: name, attendance, named companions (configurable limit), deadline, one private wish per guest, personal link to change Yes ↔ No from any device, duplicate detection.
- **Couple's dashboard**: overview stats, guest list with filters, search, notes, archiving, manual entries and CSV export; private wishes; content, gallery, music, gifts and appearance editors; live preview.
- **Templates**: Champagne Classic, Beige Minimal and Golden Elegance, plus curated accent colors.
- **Push notifications** to the couple's phones (installable dashboard app) for every RSVP, change and wish.
- **Read-only demo role** and a reproducible demo wedding (`npm run demo:seed`).
- Daily keep-alive job so the free Supabase project is never paused.

[Unreleased]: https://github.com/Daniiel18/plataforma-bodas/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Daniiel18/plataforma-bodas/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Daniiel18/plataforma-bodas/releases/tag/v1.0.0
