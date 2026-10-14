// Creates a new wedding with all its sections ready to be filled in from the panel.
//
// Usage:
//   npm run wedding:create -- <slug> "<Partner 1 name>" "<Partner 2 name>"
//
// Then grant panel access to the couple's account:
//   npm run admin:link -- couple@email.com <slug>

import postgres from "postgres";

const [slug, partner1, partner2] = process.argv.slice(2);
if (!slug || !partner1 || !partner2 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(
    'Usage: npm run wedding:create -- <slug> "<Partner 1>" "<Partner 2>"   (slug: lowercase, digits and dashes)',
  );
  process.exit(1);
}

const SECTIONS = [
  "intro",
  "hero",
  "parents",
  "celebration",
  "gallery",
  "location",
  "dress_code",
  "program",
  "rsvp",
  "gifts",
  "music",
];

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

try {
  await sql.begin(async (tx) => {
    const [wedding] = await tx`
      insert into public.weddings (slug, partner1_name, partner2_name)
      values (${slug}, ${partner1}, ${partner2})
      returning id`;
    for (const [position, type] of SECTIONS.entries()) {
      await tx`insert into public.sections (wedding_id, type, position) values (${wedding.id}, ${type}, ${position})`;
    }
    await tx`insert into public.gift_methods (wedding_id, type) values (${wedding.id}, 'zelle')`;
  });
  console.log(`Wedding "${slug}" created. Next: npm run admin:link -- couple@email.com ${slug}`);
} catch (error) {
  console.error(error.code === "23505" ? `The slug "${slug}" is already taken.` : error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
