// Loads or removes sample guest responses to try out the panel.
// Every sample row is tagged with the admin note "Dato de prueba".
//
// Usage:
//   npm run demo:data -- <slug>           -> adds the samples
//   npm run demo:data -- <slug> --remove  -> removes them (with companions and wishes)

import postgres from "postgres";

const NOTE = "Dato de prueba";
const [slug] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!slug) {
  console.error("Usage: npm run demo:data -- <slug> [--remove]");
  process.exit(1);
}
const remove = process.argv.includes("--remove");

const DEMO = [
  {
    name: "Ana Pérez",
    attending: true,
    companions: ["Luis Pérez", "Sofía Pérez"],
    wish: { message: "¡Los queremos muchísimo! Que este sea el comienzo de una vida llena de amor.", read: false },
  },
  {
    name: "Carlos Méndez",
    attending: false,
    wish: { message: "No podré estar, pero los acompaño de corazón. ¡Felicidades!", read: true },
  },
  { name: "Ana Perez", attending: true, companions: [] },
  {
    name: "John Smith",
    attending: true,
    locale: "en",
    companions: ["Mary Smith"],
    wish: { message: "Congratulations! Wishing you a lifetime of happiness.", read: false },
  },
  { name: "María Gómez", attending: true, companions: [] },
];

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

try {
  const [wedding] = await sql`select id from public.weddings where slug = ${slug}`;
  if (!wedding) throw new Error(`Wedding "${slug}" not found`);

  const removed = await sql`
    delete from public.rsvps where wedding_id = ${wedding.id} and admin_note = ${NOTE} returning id`;
  if (remove) {
    console.log(`Removed ${removed.length} sample responses.`);
  } else {
    await sql.begin(async (tx) => {
      for (const d of DEMO) {
        const [r] = await tx`
          insert into public.rsvps (wedding_id, full_name, attending, locale, admin_note)
          values (${wedding.id}, ${d.name}, ${d.attending}, ${d.locale ?? "es"}, ${NOTE})
          returning id`;
        for (const [position, name] of (d.companions ?? []).entries()) {
          await tx`insert into public.rsvp_companions (rsvp_id, full_name, position) values (${r.id}, ${name}, ${position})`;
        }
        if (d.wish) {
          await tx`
            insert into public.wishes (rsvp_id, message, locale, is_read)
            values (${r.id}, ${d.wish.message}, ${d.locale ?? "es"}, ${d.wish.read})`;
        }
      }
    });
    console.log(`Added ${DEMO.length} sample responses.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
