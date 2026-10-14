// Grants panel access to an account that already exists in Supabase Auth.
//
// Usage:
//   npm run admin:link -- couple@email.com <slug>            -> owner (can edit)
//   npm run admin:link -- demo@email.com <slug> --viewer     -> read-only (public demo)

import postgres from "postgres";

const [email, slug] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const role = process.argv.includes("--viewer") ? "viewer" : "owner";
if (!email || !slug) {
  console.error("Usage: npm run admin:link -- user@email.com <slug> [--viewer]");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

try {
  await sql`
    insert into public.wedding_members (wedding_id, user_id, role)
    select w.id, u.id, ${role}
    from public.weddings w, auth.users u
    where w.slug = ${slug} and lower(u.email) = lower(${email})
    on conflict (wedding_id, user_id) do update set role = excluded.role
    `;

  const [exists] = await sql`
    select 1
    from public.wedding_members m
    join public.weddings w on w.id = m.wedding_id
    join auth.users u on u.id = m.user_id
    where w.slug = ${slug} and lower(u.email) = lower(${email})`;

  if (!exists) {
    console.error(`Account ${email} or wedding "${slug}" not found.`);
    process.exitCode = 1;
  } else {
    console.log(`${email} now has ${role} access to "${slug}".`);
  }
} finally {
  await sql.end();
}
