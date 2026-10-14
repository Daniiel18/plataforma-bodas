import { CalendarHeartIcon, CopyIcon, HeartIcon, UserCheckIcon, UserXIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminContext } from "@/lib/admin";
import { daysUntil, displayZone, formatDateTime, formatShortDateTime, isPast } from "@/lib/dates";
import type { DuplicateMatch, Rsvp, WeddingStats } from "@/lib/types";

import { BlockSkeleton, CardsSkeleton, PageHeader } from "./page-header";

export const metadata: Metadata = { title: "Resumen" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Resumen" />
      <Suspense
        fallback={
          <div className="grid gap-6">
            <CardsSkeleton />
            <BlockSkeleton />
          </div>
        }
      >
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const { supabase, wedding } = await getAdminContext();

  const [{ data: statsRows }, { data: duplicates }, { data: latest }] = await Promise.all([
    supabase.rpc("wedding_stats", { p_wedding_id: wedding.id }),
    supabase.rpc("rsvp_duplicate_matches", { p_wedding_id: wedding.id }),
    supabase
      .from("rsvps")
      .select("id, full_name, attending, created_at, updated_at, change_count")
      .eq("wedding_id", wedding.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const stats: WeddingStats = (statsRows as WeddingStats[] | null)?.[0] ?? {
    responses: 0,
    attending: 0,
    declined: 0,
    companions: 0,
    total_people: 0,
    wishes: 0,
    unread_wishes: 0,
  };
  const duplicateCount = new Set((duplicates as DuplicateMatch[] | null)?.map((d) => d.rsvp_id)).size;
  const zone = displayZone(wedding.timezone);
  const daysToWedding = wedding.event_starts_at ? daysUntil(wedding.event_starts_at) : null;
  const deadline = wedding.rsvp_deadline;
  const rsvpOpen = !deadline || !isPast(deadline);

  const cards = [
    {
      label: "Personas que asistirán",
      value: stats.total_people,
      hint: `${stats.attending} respuestas + ${stats.companions} acompañantes`,
      icon: UsersIcon,
    },
    { label: "Asisten", value: stats.attending, hint: "respuestas con Sí", icon: UserCheckIcon },
    { label: "No asisten", value: stats.declined, hint: "respuestas con No", icon: UserXIcon },
    {
      label: "Deseos",
      value: stats.wishes,
      hint: stats.unread_wishes ? `${stats.unread_wishes} sin leer` : "todos leídos",
      icon: HeartIcon,
    },
  ];

  return (
    <>
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        {wedding.event_starts_at
          ? `Boda el ${formatDateTime(wedding.event_starts_at, zone)}`
          : "Todavía no has definido la fecha de la boda."}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label} className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarHeartIcon className="size-4" /> Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p>
              {daysToWedding === null ? (
                <>
                  Fecha de la boda: <Badge variant="secondary">Sin definir</Badge>
                </>
              ) : daysToWedding > 0 ? (
                <>
                  Faltan <strong>{daysToWedding} días</strong> para la boda.
                </>
              ) : (
                "¡La boda ya llegó!"
              )}
            </p>
            <p>
              Invitación:{" "}
              {wedding.is_published ? <Badge>Publicada</Badge> : <Badge variant="secondary">Borrador</Badge>}
            </p>
            <p>
              Confirmaciones: {rsvpOpen ? <Badge>Abiertas</Badge> : <Badge variant="destructive">Cerradas</Badge>}{" "}
              <span className="text-muted-foreground">
                {deadline ? `hasta ${formatDateTime(deadline, zone)}` : "sin fecha límite"}
              </span>
            </p>
            <Link href="/admin/ajustes" className="text-muted-foreground underline underline-offset-4">
              Cambiar en Ajustes
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas respuestas</CardTitle>
            {duplicateCount > 0 && (
              <Link href="/admin/invitados?filtro=duplicados">
                <Badge variant="destructive" className="gap-1">
                  <CopyIcon className="size-3" /> {duplicateCount} posibles duplicados
                </Badge>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {latest?.length ? (
              <ul className="divide-y">
                {(latest as Pick<Rsvp, "id" | "full_name" | "attending" | "updated_at" | "change_count">[]).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="truncate">{r.full_name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                      {formatShortDateTime(r.updated_at, zone)}
                      {r.attending ? <Badge>Sí</Badge> : <Badge variant="secondary">No</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no hay respuestas.</p>
            )}
            <Link
              href="/admin/invitados"
              className="mt-4 inline-block text-sm text-muted-foreground underline underline-offset-4"
            >
              Ver todos los invitados
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
