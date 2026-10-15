# Contributing

Thanks for your interest in improving the platform! Bug reports, ideas and pull requests are welcome.

## Before you start

- For anything larger than a small fix, [open an issue](https://github.com/Daniiel18/plataforma-bodas/issues/new/choose) first so we can agree on the approach.
- Never include real guest data (names, phone numbers, photos) in issues, screenshots or test fixtures.
- Security problems must be reported privately — see [SECURITY.md](SECURITY.md).

## Development setup

1. Follow [Getting started](README.md#getting-started) to run the app against your own free Supabase project.
2. Create a branch from `main`: `git switch -c feat/short-description`.
3. Make your change and run the full quality gate:

   ```bash
   npm run check   # lint + types + unit tests + formatting
   npm run build   # production build
   ```

4. Open a pull request and fill in the template. CI must be green before review.

## Guidelines

- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`.
- **Code, comments and commit messages** are written in English.
- **UI text** is bilingual. Guest-facing strings go through the `T` component with Spanish and English versions; dashboard text is Spanish.
- **Database changes** go in a new timestamped file in `supabase/migrations/` — never change the SQL of an applied migration. Every new table needs Row Level Security, and write policies must use `is_wedding_editor()`.
- **Server Actions** must authorize themselves with `getAdminContext()` and return `READ_ONLY_RESULT` for read-only accounts.
- **Next.js 16 / Cache Components**: request-time data (cookies, `searchParams`, sessions) must live behind `<Suspense>`; public invitation data is cached with `"use cache"` and refreshed with `updateTag`.
- **Templates** are one entry in `src/lib/templates.ts`; a new background is one entry in `src/lib/backgrounds.ts` plus its `[data-bg]` rule in `invitation.css`. Ornaments must be original SVGs that read the `--inv-orn-*` variables.
- Keep the guest experience fast on mobile data: compress media and avoid heavy client dependencies.

## Contribution terms

This project is proprietary (see [LICENSE](LICENSE)). By submitting a pull request you confirm that the contribution is your own original work, and you grant the copyright holder a perpetual, worldwide, irrevocable, royalty-free license to use, modify, distribute and sublicense it as part of this project. You keep the right to use your own contribution elsewhere.
