# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- **Add to calendar** is now a single button that opens the right calendar for the guest's device (Apple Calendar on iPhone, Google Calendar on Android, an `.ics` file on computers) instead of a menu.
- **Get directions** is now a single button: Android opens the system's map app chooser, iPhone shows a native-style sheet with Apple Maps, Google Maps and Waze, and computers open Google Maps.

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
