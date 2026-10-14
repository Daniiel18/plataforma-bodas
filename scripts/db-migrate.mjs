// Applies supabase/migrations (in order) to the database in DATABASE_URL.
// Each migration runs in its own transaction and is recorded in
// private.schema_migrations so it never runs twice.
//
// Usage:
//   npm run db:migrate

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql`create schema if not exists private`;
  await sql`
    create table if not exists private.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;

  const applied = new Set((await sql`select name from private.schema_migrations`).map((r) => r.name));
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= ${file} (already applied)`);
      continue;
    }
    const body = await readFile(path.join(migrationsDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into private.schema_migrations (name) values (${file})`;
    });
    console.log(`+ ${file}`);
  }

  console.log("Database is up to date.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
