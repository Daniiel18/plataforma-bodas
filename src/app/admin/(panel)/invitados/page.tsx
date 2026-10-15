import { DownloadIcon, HeartIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminContext } from "@/lib/admin";
import { displayZone, formatShortDateTime } from "@/lib/dates";
import type { DuplicateMatch, RsvpWithDetails, Wish } from "@/lib/types";
import { cn } from "@/lib/utils";

import { BlockSkeleton, PageHeader } from "../page-header";
import { ManualRsvpDialog } from "./manual-rsvp-dialog";
import { RsvpActions } from "./rsvp-actions";

export const metadata: Metadata = { title: "Invitados" };

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "asisten", label: "Asisten" },
  { key: "no-asisten", label: "No asisten" },
  { key: "duplicados", label: "Posibles duplicados" },
  { key: "archivados", label: "Archivados" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

type Row = Omit<RsvpWithDetails, "wishes"> & {
  wish: Pick<Wish, "id" | "is_read"> | null;
  duplicates: string[];
};

export default function GuestsPage({ searchParams }: PageProps<"/admin/invitados">) {
  return (
    <>
      <PageHeader
        title="Invitados"
        description="Respuestas del formulario de asistencia. Las archivadas no cuentan en los totales."
        actions={
          <>
            <Suspense
              fallback={
                <Button disabled>
                  <PlusIcon /> Agregar respuesta
                </Button>
              }
            >
              <AddRsvpButton />
            </Suspense>
            <Button variant="outline" asChild>
              <a href="/admin/invitados/exportar" download>
                <DownloadIcon /> Exportar CSV
              </a>
            </Button>
          </>
        }
      />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <GuestList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AddRsvpButton() {
  const { wedding } = await getAdminContext();
  return <ManualRsvpDialog maxCompanions={wedding.max_companions} />;
}

async function GuestList({ searchParams }: Pick<PageProps<"/admin/invitados">, "searchParams">) {
  const params = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === params.filtro) ? (params.filtro as FilterKey) : "todos";
  const query = typeof params.q === "string" ? params.q : "";

  const { supabase, wedding } = await getAdminContext();
  const [{ data: rsvps, error }, { data: matches }] = await Promise.all([
    supabase
      .from("rsvps")
      .select("*, rsvp_companions(id, full_name, position), wishes(id, is_read)")
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("rsvp_duplicate_matches", { p_wedding_id: wedding.id }),
  ]);

  const duplicatesByRsvp = new Map<string, Set<string>>();
  for (const m of (matches as DuplicateMatch[] | null) ?? []) {
    const set = duplicatesByRsvp.get(m.rsvp_id) ?? new Set<string>();
    set.add(`${m.name} ≈ ${m.matched_name}`);
    duplicatesByRsvp.set(m.rsvp_id, set);
  }

  const all: Row[] = ((rsvps ?? []) as (RsvpWithDetails & { wishes: unknown })[]).map((r) => {
    const wish = Array.isArray(r.wishes) ? (r.wishes[0] ?? null) : (r.wishes as Row["wish"]);
    return {
      ...r,
      rsvp_companions: [...r.rsvp_companions].sort((a, b) => a.position - b.position),
      wish,
      duplicates: [...(duplicatesByRsvp.get(r.id) ?? [])],
    };
  });

  const needle = normalize(query);
  const rows = all.filter((r) => {
    const byFilter =
      filter === "archivados"
        ? r.is_archived
        : !r.is_archived &&
          (filter === "todos" ||
            (filter === "asisten" && r.attending) ||
            (filter === "no-asisten" && !r.attending) ||
            (filter === "duplicados" && r.duplicates.length > 0));
    if (!byFilter) return false;
    if (!needle) return true;
    return [r.full_name, ...r.rsvp_companions.map((c) => c.full_name)].some((n) => normalize(n).includes(needle));
  });

  const zone = displayZone(wedding.timezone);
  const peopleShown = rows.reduce((sum, r) => sum + (r.attending ? 1 + r.rsvp_companions.length : 0), 0);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={{ query: { ...(f.key !== "todos" && { filtro: f.key }), ...(query && { q: query }) } }}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent",
                filter === f.key && "border-primary bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {filter !== "todos" && <input type="hidden" name="filtro" value={filter} />}
          <Input name="q" defaultValue={query} placeholder="Buscar por nombre…" className="md:w-64" />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
      </div>

      {error && <p className="text-sm text-destructive">No se pudieron cargar las respuestas.</p>}

      <p className="mb-2 text-sm text-muted-foreground">
        {rows.length} {rows.length === 1 ? "respuesta" : "respuestas"} · {peopleShown}{" "}
        {peopleShown === 1 ? "persona asiste" : "personas asisten"}
      </p>

      {rows.length === 0 ? (
        <Card className="items-center p-10 text-center text-sm text-muted-foreground">
          {all.length === 0 ? "Todavía no hay respuestas." : "Ninguna respuesta coincide con el filtro."}
        </Card>
      ) : (
        <>
          {/* Desktop: table */}
          <Card className="hidden py-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre y acompañantes</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead className="text-right">Personas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className={cn(r.is_archived && "opacity-60")}>
                    <TableCell className="max-w-md whitespace-normal">
                      <GuestName row={r} />
                    </TableCell>
                    <TableCell>
                      <AttendanceBadge row={r} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.attending ? 1 + r.rsvp_companions.length : 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatShortDateTime(r.updated_at, zone)}</TableCell>
                    <TableCell>
                      <RsvpActions
                        rsvp={{ id: r.id, attending: r.attending, isArchived: r.is_archived, note: r.admin_note ?? "" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Phone: cards */}
          <ul className="grid gap-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Card className={cn("gap-3 px-4 py-4", r.is_archived && "opacity-60")}>
                  <div className="flex items-start justify-between gap-2">
                    <GuestName row={r} />
                    <RsvpActions
                      rsvp={{ id: r.id, attending: r.attending, isArchived: r.is_archived, note: r.admin_note ?? "" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <AttendanceBadge row={r} />
                    <span>{formatShortDateTime(r.updated_at, zone)}</span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function GuestName({ row }: { row: Row }) {
  return (
    <div className="grid gap-1">
      <p className="flex flex-wrap items-center gap-2 font-medium">
        {row.full_name}
        {row.wish && (
          <Link href="/admin/deseos" title={row.wish.is_read ? "Dejó un deseo" : "Deseo sin leer"}>
            <HeartIcon
              className={cn("size-4", row.wish.is_read ? "text-muted-foreground" : "fill-primary text-primary")}
            />
          </Link>
        )}
        {row.locale === "en" && <Badge variant="outline">EN</Badge>}
        {row.is_archived && <Badge variant="outline">Archivada</Badge>}
      </p>
      {row.rsvp_companions.length > 0 && (
        <p className="text-sm text-muted-foreground">+ {row.rsvp_companions.map((c) => c.full_name).join(", ")}</p>
      )}
      {row.duplicates.length > 0 && (
        <p className="text-xs text-destructive">Posible duplicado: {row.duplicates.join(" · ")}</p>
      )}
      {row.admin_note && <p className="text-xs text-muted-foreground italic">Nota: {row.admin_note}</p>}
    </div>
  );
}

function AttendanceBadge({ row }: { row: Row }) {
  return (
    <span className="flex items-center gap-2">
      {row.attending ? <Badge>Asiste</Badge> : <Badge variant="secondary">No asiste</Badge>}
      {row.change_count > 0 && (
        <span className="text-xs text-muted-foreground">
          cambió {row.change_count} {row.change_count === 1 ? "vez" : "veces"}
        </span>
      )}
    </span>
  );
}
