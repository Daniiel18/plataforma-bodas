// Snapshot of every wedding: each table in `public` as JSON plus the files in
// the `wedding-media` bucket, under backups/<date>/ (git-ignored). The free
// Supabase plan has no downloadable backups, so run this before big changes
// and keep a copy somewhere safe.
//
// Usage:
//   npm run db:backup               -> tables + files
//   npm run db:backup -- --no-files -> tables only

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !supabaseUrl) {
  console.error("Missing DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

const withFiles = !process.argv.includes("--no-files");
const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
const root = path.resolve(import.meta.dirname, "..", "backups", stamp);

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await mkdir(path.join(root, "tables"), { recursive: true });

  const tables = await sql`
    select table_name as name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name`;
  const manifest = { createdAt: new Date().toISOString(), tables: {}, files: 0 };

  for (const { name } of tables) {
    const rows = await sql`select * from ${sql("public." + name)}`;
    await writeFile(path.join(root, "tables", `${name}.json`), JSON.stringify(rows, null, 2));
    manifest.tables[name] = rows.length;
    console.log(`  ${name.padEnd(20)} ${rows.length} rows`);
  }

  if (withFiles) {
    const objects = await sql`
      select name from storage.objects where bucket_id = 'wedding-media' order by name`;
    for (const { name } of objects) {
      const response = await fetch(`${supabaseUrl}/storage/v1/object/public/wedding-media/${name}`);
      if (!response.ok) {
        console.warn(`  ! ${name}: HTTP ${response.status}`);
        continue;
      }
      const target = path.join(root, "files", ...name.split("/"));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(await response.arrayBuffer()));
      manifest.files++;
    }
    console.log(`  ${"files".padEnd(20)} ${manifest.files}`);
  }

  await writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Backup saved to ${path.relative(process.cwd(), root)}`);
} catch (error) {
  console.error("Backup failed:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
