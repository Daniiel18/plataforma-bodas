import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BlockSkeleton, PageHeader } from "@/app/panel/(panel)/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformAdmin } from "@/lib/platform-admin";

import { BarRow, formatBytes } from "../ui";

export const metadata: Metadata = { title: "Uso del plan" };

/** Limits of the free plans the platform runs on. */
const LIMITS = { database: 500 * 1024 * 1024, storage: 1024 * 1024 * 1024 };
const SUPABASE_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://x.supabase.co").hostname.split(".")[0];

export default function UsagePage() {
  return (
    <>
      <PageHeader title="Uso del plan" description="Cuánto de los planes gratis de Supabase y Vercel está en uso." />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <Usage />
      </Suspense>
    </>
  );
}

function Gauge({ label, used, limit }: { label: string; used: number; limit: number }) {
  const share = used / limit;
  const tone = share >= 0.8 ? "bg-destructive" : share >= 0.6 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="grid gap-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatBytes(used)} de {formatBytes(limit)} · {Math.round(share * 100)}%
        </span>
      </div>
      <span className="h-3 overflow-hidden rounded-full bg-muted">
        <span
          className={`block h-full rounded-full ${tone}`}
          style={{ width: `${Math.min(100, Math.max(1, share * 100))}%` }}
        />
      </span>
      {share >= 0.8 && (
        <p className="text-xs text-destructive">
          Cerca del límite gratis: conviene liberar espacio o pasar a un plan de pago.
        </p>
      )}
    </div>
  );
}

async function Usage() {
  const { db } = await getPlatformAdmin();
  const [{ data: usage }, { data: byWedding }, { data: weddings }, { count: events }] = await Promise.all([
    db.rpc("platform_usage"),
    db.rpc("storage_by_wedding"),
    db.from("weddings").select("id, slug"),
    db.from("analytics_events").select("id", { count: "exact", head: true }),
  ]);

  const totals = ((usage ?? []) as { database_bytes: number; storage_bytes: number; storage_files: number }[])[0];
  const slugs = new Map((weddings ?? []).map((w) => [w.id, w.slug]));
  const top = ((byWedding ?? []) as { wedding_id: string; bytes: number; files: number }[])
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Supabase (plan gratis)</CardTitle>
          <CardDescription>Medido ahora mismo en la base de datos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Gauge label="Base de datos" used={totals?.database_bytes ?? 0} limit={LIMITS.database} />
          <Gauge label="Fotos y música" used={totals?.storage_bytes ?? 0} limit={LIMITS.storage} />
          <p className="text-xs text-muted-foreground">
            {totals?.storage_files ?? 0} archivos · {(events ?? 0).toLocaleString("es")} eventos de analítica guardados.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lo que se mide fuera</CardTitle>
          <CardDescription>
            La transferencia (5 GB al mes en Supabase, 100 GB en Vercel) solo la muestran sus paneles.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <a
            className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
            href={`https://supabase.com/dashboard/project/${SUPABASE_REF}/settings/usage`}
            target="_blank"
            rel="noopener"
          >
            <ExternalLinkIcon className="size-4" /> Uso en Supabase
          </a>
          <a
            className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
            href="https://vercel.com/dashboard/usage"
            target="_blank"
            rel="noopener"
          >
            <ExternalLinkIcon className="size-4" /> Uso en Vercel
          </a>
          <p className="text-xs text-muted-foreground">
            La música de la biblioteca se sirve desde Vercel, así que no gasta la transferencia de Supabase.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Bodas que más espacio usan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {top.map((w) => (
            <Link key={w.wedding_id} href={`/admin/bodas/${w.wedding_id}`} className="hover:opacity-80">
              <BarRow
                label={`/${slugs.get(w.wedding_id) ?? "borrada"}`}
                value={Math.round(w.bytes / 1024 / 1024)}
                max={Math.max(1, Math.round(top[0].bytes / 1024 / 1024))}
                suffix=" MB"
              />
            </Link>
          ))}
          {!top.length && <p className="text-sm text-muted-foreground">Todavía no hay archivos.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
