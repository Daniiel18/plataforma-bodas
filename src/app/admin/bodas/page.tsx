import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BlockSkeleton, PageHeader } from "@/app/panel/(panel)/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountCategories, getPlatformAdmin } from "@/lib/platform-admin";

import { formatBytes, formatDate, StatusBadge } from "../ui";

export const metadata: Metadata = { title: "Bodas" };

const STATUSES = [
  { value: "", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "draft", label: "Borradores" },
  { value: "read_only", label: "Solo lectura" },
  { value: "suspended", label: "Suspendidas" },
  { value: "archived", label: "Archivadas" },
];

export default function WeddingsPage({ searchParams }: PageProps<"/admin/bodas">) {
  return (
    <>
      <PageHeader title="Bodas" description="Todas las bodas de la plataforma, con su cuenta y sus números." />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <WeddingList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

async function WeddingList({ searchParams }: { searchParams: PageProps<"/admin/bodas">["searchParams"] }) {
  const { db } = await getPlatformAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.estado === "string" ? params.estado : "";
  const kind = typeof params.tipo === "string" ? params.tipo : "";

  const [{ data: weddings }, { data: members }, users, { data: rsvps }, { data: storage }] = await Promise.all([
    db
      .from("weddings")
      .select("id, slug, partner1_name, partner2_name, status, is_published, event_starts_at, created_at")
      .order("created_at", { ascending: false }),
    db.from("wedding_members").select("wedding_id, user_id").eq("role", "owner"),
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("rsvps").select("wedding_id, attending").eq("is_archived", false),
    db.rpc("storage_by_wedding"),
  ]);
  const categories = await accountCategories(db);

  const emails = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const owner = new Map((members ?? []).map((m) => [m.wedding_id, emails.get(m.user_id) ?? ""]));
  const replies = new Map<string, number>();
  for (const r of rsvps ?? []) replies.set(r.wedding_id, (replies.get(r.wedding_id) ?? 0) + 1);
  const bytes = new Map(
    ((storage ?? []) as { wedding_id: string; bytes: number }[]).map((s) => [s.wedding_id, s.bytes]),
  );

  const needle = normalize(q);
  const rows = (weddings ?? []).filter(
    (w) =>
      (!status || w.status === status) &&
      (!kind || (kind === "reales") === categories.isRealWedding(w)) &&
      (!needle ||
        normalize(`${w.slug} ${w.partner1_name} ${w.partner2_name} ${owner.get(w.id) ?? ""}`).includes(needle)),
  );

  return (
    <div className="grid gap-4">
      <form className="flex flex-wrap gap-2" action="/admin/bodas">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombres, enlace o correo" className="max-w-sm" />
        <select
          name="estado"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          aria-label="Estado"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          name="tipo"
          defaultValue={kind}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          aria-label="Tipo"
        >
          <option value="">Reales y de prueba</option>
          <option value="reales">Solo reales</option>
          <option value="prueba">Solo de prueba</option>
        </select>
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground">
          Filtrar
        </button>
      </form>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Boda</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Cuenta</TableHead>
              <TableHead className="text-right">Respuestas</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Archivos</TableHead>
              <TableHead className="hidden lg:table-cell">Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <Link href={`/admin/bodas/${w.id}`} className="font-medium hover:underline">
                    {w.partner1_name.split(" ")[0]} & {w.partner2_name.split(" ")[0]}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    /{w.slug}{" "}
                    {!categories.isRealWedding(w) && (
                      <Badge variant="secondary" className="ml-1">
                        {w.slug === "demo" ? "Demo" : owner.get(w.id) ? "Prueba" : "Sin cuenta"}
                      </Badge>
                    )}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={w.status} published={w.is_published} />
                </TableCell>
                <TableCell className="hidden max-w-48 truncate text-sm md:table-cell">
                  {owner.get(w.id) || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{replies.get(w.id) ?? 0}</TableCell>
                <TableCell className="hidden text-right text-sm tabular-nums sm:table-cell">
                  {formatBytes(bytes.get(w.id) ?? 0)}
                </TableCell>
                <TableCell className="hidden text-sm lg:table-cell">{formatDate(w.created_at)}</TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Ninguna boda coincide.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
