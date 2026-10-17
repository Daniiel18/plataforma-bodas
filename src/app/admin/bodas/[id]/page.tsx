import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { BlockSkeleton } from "@/app/panel/(panel)/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lifecycleDates } from "@/lib/lifecycle";
import { findTrack } from "@/lib/music-library";
import { getPlatformAdmin, PROTECTED_SLUGS } from "@/lib/platform-admin";
import { parseContent } from "@/lib/sections";
import { SITE_URL } from "@/lib/site";

import { formatBytes, formatDate, Stat, StatusBadge } from "../../ui";
import { DeleteWedding, SuspendControls } from "./suspend-controls";

export const metadata: Metadata = { title: "Boda" };

export default function WeddingDetailPage({ params }: PageProps<"/admin/bodas/[id]">) {
  return (
    <>
      <Link href="/admin/bodas" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeftIcon className="size-4" /> Bodas
      </Link>
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <WeddingDetail params={params} />
      </Suspense>
    </>
  );
}

const ACTIONS: Record<string, string> = {
  "wedding.created_from_builder": "Creada desde el creador",
  "wedding.design_replaced": "Diseño reemplazado",
  "wedding.published": "Publicada por primera vez",
  "wedding.suspended": "Suspendida",
  "wedding.reactivated": "Reactivada",
  "wedding.deleted": "Eliminada",
};

async function WeddingDetail({ params }: { params: PageProps<"/admin/bodas/[id]">["params"] }) {
  const { db } = await getPlatformAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { data: w } = await db.from("weddings").select("*").eq("id", id).maybeSingle();
  if (!w) notFound();

  const [{ data: members }, { data: stats }, { data: storage }, { data: media }, { data: music }, { data: audit }] =
    await Promise.all([
      db.from("wedding_members").select("user_id, role").eq("wedding_id", id),
      db.rpc("wedding_stats", { p_wedding_id: id }),
      db.rpc("storage_by_wedding"),
      db.from("media").select("kind").eq("wedding_id", id),
      db.from("sections").select("content").eq("wedding_id", id).eq("type", "music").maybeSingle(),
      db
        .from("audit_log")
        .select("created_at, action, details")
        .eq("target_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const accounts = await Promise.all(
    (members ?? []).map(async (m) => ({ ...m, user: (await db.auth.admin.getUserById(m.user_id)).data.user })),
  );
  const s = (stats as { responses: number; attending: number; total_people: number; wishes: number }[] | null)?.[0];
  const used = ((storage ?? []) as { wedding_id: string; bytes: number; files: number }[]).find(
    (x) => x.wedding_id === id,
  );
  const kinds = (media ?? []).reduce<Record<string, number>>(
    (acc, m) => ({ ...acc, [m.kind]: (acc[m.kind] ?? 0) + 1 }),
    {},
  );
  const track = findTrack(parseContent("music", music?.content).track);
  const dates = lifecycleDates(w);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-medium md:text-4xl">
            {w.partner1_name} & {w.partner2_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={w.status} published={w.is_published} />
            <span>/{w.slug}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {w.is_published && ["active", "read_only"].includes(w.status) && (
            <Button variant="outline" asChild>
              <a href={`${SITE_URL}/${w.slug}`} target="_blank" rel="noopener">
                <ExternalLinkIcon /> Ver invitación
              </a>
            </Button>
          )}
          {PROTECTED_SLUGS.has(w.slug) ? (
            <span className="self-center text-xs text-muted-foreground">
              La demo de la página principal está protegida.
            </span>
          ) : (
            <>
              {w.status !== "archived" && <SuspendControls weddingId={w.id} suspended={w.status === "suspended"} />}
              <DeleteWedding weddingId={w.id} slug={w.slug} />
            </>
          )}
        </div>
      </div>

      {w.status === "suspended" && w.suspension_reason && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <strong>Motivo de la suspensión:</strong> {w.suspension_reason}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Respuestas" value={s?.responses ?? 0} hint={`${s?.attending ?? 0} asisten`} />
        <Stat label="Personas" value={s?.total_people ?? 0} hint="con acompañantes" />
        <Stat label="Deseos" value={s?.wishes ?? 0} />
        <Stat label="Archivos" value={formatBytes(used?.bytes ?? 0)} hint={`${used?.files ?? 0} archivos`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row label="Fecha de la boda" value={formatDate(w.event_starts_at, true)} />
            <Row label="Creada" value={formatDate(w.created_at, true)} />
            <Row label="Publicada" value={formatDate(w.published_at, true)} />
            <Row label="Solo lectura desde" value={formatDate(dates.readOnlyAt?.toISOString())} />
            <Row label="Se archiva" value={formatDate(dates.archiveAt?.toISOString())} />
            {dates.draftDeleteAt && (
              <Row label="Borrador se borra" value={formatDate(dates.draftDeleteAt.toISOString())} />
            )}
            <Row label="Plantilla" value={w.template_key} />
            <Row
              label="Acompañantes"
              value={`${w.companions_mode === "count" ? "Solo cantidad" : "Con nombres"} · máx. ${w.max_companions}`}
            />
            <Row label="Deseos públicos" value={w.guestbook_public ? "Sí" : "No"} />
            <Row
              label="Fotos"
              value={`${kinds.cover ? "portada · " : ""}${kinds.gallery ?? 0} en galería${kinds.background ? " · fondo" : ""}`}
            />
            <Row
              label="Música"
              value={track ? `Biblioteca: ${track.title.es}` : kinds.audio ? "Canción propia" : "Sin música"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {accounts.map(({ user, role }) => (
              <div key={user?.id ?? role} className="grid gap-1">
                <p className="font-medium">{user?.email ?? "—"}</p>
                <p className="text-muted-foreground">
                  {role === "owner" ? "Dueña" : "Solo lectura"} · entra con{" "}
                  {(user?.app_metadata?.providers as string[] | undefined)?.join(", ") ?? "—"}
                </p>
                <p className="text-muted-foreground">
                  Cuenta desde {formatDate(user?.created_at)} · última vez {formatDate(user?.last_sign_in_at, true)}
                </p>
              </div>
            ))}
            {!accounts.length && <p className="text-muted-foreground">Sin cuenta vinculada.</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {(audit ?? []).map((a, i) => (
              <div key={i} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
                <span>
                  {ACTIONS[a.action] ?? a.action}
                  {a.details?.reason ? ` · ${a.details.reason}` : ""}
                </span>
                <span className="text-muted-foreground">{formatDate(a.created_at, true)}</span>
              </div>
            ))}
            {!audit?.length && <p className="text-muted-foreground">Sin acciones registradas.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
