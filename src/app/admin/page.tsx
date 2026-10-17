import type { Metadata } from "next";
import { Suspense } from "react";

import { BlockSkeleton, CardsSkeleton, PageHeader } from "@/app/panel/(panel)/page-header";
import { PushNotificationsCard } from "@/components/push-notifications-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { accountCategories, getPlatformAdmin } from "@/lib/platform-admin";

import { removeAdminPush, saveAdminPush, testAdminPush } from "./actions";
import { BarRow, Stat } from "./ui";

export const metadata: Metadata = { title: "Resumen" };

const DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

/** Start of the period and the last 14 calendar days (UTC), computed per request. */
const periodStart = () => new Date(Date.now() - DAYS * DAY);
const lastDays = (count: number) =>
  Array.from({ length: count }, (_, i) => new Date(Date.now() - (count - 1 - i) * DAY).toISOString().slice(0, 10));

const COUNTRY = new Intl.DisplayNames(["es"], { type: "region" });
const countryName = (code: string) => {
  try {
    return COUNTRY.of(code) ?? code;
  } catch {
    return code;
  }
};

export default function AdminHome() {
  return (
    <>
      <PageHeader
        title="Resumen"
        description={`La plataforma de un vistazo (sin cuentas de prueba ni de administración) y el embudo de los últimos ${DAYS} días.`}
      />
      <Suspense
        fallback={
          <div className="grid gap-6">
            <CardsSkeleton />
            <BlockSkeleton />
          </div>
        }
      >
        <Overview />
      </Suspense>
    </>
  );
}

type EventRow = {
  name: string;
  anonymous_id: string | null;
  occurred_at: string;
  country: string | null;
  device: string | null;
};

async function Overview() {
  const { db, userId } = await getPlatformAdmin();
  const since = periodStart();

  const [{ data: weddings }, users, { data: replyRows }, { data: wishRows }, { data: events }, { count: devices }] =
    await Promise.all([
      db.from("weddings").select("id, slug, status, is_published, created_at, published_at"),
      db.auth.admin.listUsers({ perPage: 1000 }),
      db.from("rsvps").select("wedding_id"),
      db.from("wishes").select("wedding_id"),
      db
        .from("analytics_events")
        .select("name, anonymous_id, occurred_at, country, device")
        .gte("occurred_at", since.toISOString())
        .order("occurred_at", { ascending: false })
        .limit(20000),
      db.from("platform_push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

  // Real numbers only: test and admin accounts, their weddings and the demo stay out.
  const categories = await accountCategories(db);
  const list = (weddings ?? []).filter(categories.isRealWedding);
  const real = new Set(list.map((w) => w.id));
  const accounts = (users.data?.users ?? []).filter((u) => categories.isRealAccount(u.id));
  const replies = (replyRows ?? []).filter((r) => real.has(r.wedding_id)).length;
  const wishes = (wishRows ?? []).filter((r) => real.has(r.wedding_id)).length;
  const recent = (date: string | null | undefined) => Boolean(date && new Date(date) >= since);

  // Funnel: unique devices that reached each step.
  const rows = (events ?? []) as EventRow[];
  const unique = (names: string[]) =>
    new Set(rows.filter((e) => names.includes(e.name)).map((e) => e.anonymous_id ?? `${e.occurred_at}`)).size;
  const funnel = [
    { label: "Visitaron la web", value: unique(["landing_view", "demo_view"]) },
    { label: "Empezaron a crear", value: unique(["builder_start"]) },
    { label: "Llegaron a revisar", value: unique(["builder_review"]) },
    { label: "Pulsaron publicar o guardar", value: unique(["publish_click", "save_click"]) },
    { label: "Publicaron", value: list.filter((w) => recent(w.published_at)).length },
  ];

  // Visitors per day (last 14 days).
  const days = lastDays(14).map((day) => {
    const ids = new Set(
      rows.filter((e) => e.occurred_at.slice(0, 10) === day && e.name === "landing_view").map((e) => e.anonymous_id),
    );
    return { day, value: ids.size };
  });

  const byCountry = new Map<string, Set<string>>();
  for (const e of rows) {
    if (!e.country || !e.anonymous_id) continue;
    if (!byCountry.has(e.country)) byCountry.set(e.country, new Set());
    byCountry.get(e.country)!.add(e.anonymous_id);
  }
  const countries = [...byCountry.entries()]
    .map(([code, ids]) => ({ code, value: ids.size }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const mobile = new Set(rows.filter((e) => e.device === "mobile").map((e) => e.anonymous_id)).size;
  const allDevices = new Set(rows.map((e) => e.anonymous_id)).size;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Cuentas"
          value={accounts.length}
          hint={`${accounts.filter((u) => recent(u.created_at)).length} nuevas en ${DAYS} días`}
        />
        <Stat
          label="Bodas publicadas"
          value={list.filter((w) => w.is_published && w.status !== "suspended").length}
          hint={`${list.length} creadas · ${list.filter((w) => w.status === "draft").length} borradores`}
        />
        <Stat label="Confirmaciones" value={replies} hint="de las bodas reales" />
        <Stat label="Deseos" value={wishes} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Embudo</CardTitle>
            <CardDescription>
              Dispositivos únicos en {DAYS} días. No cuenta a quien tiene «No rastrear» activado.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {funnel.map((step, i) => (
              <div key={step.label} className="grid gap-1">
                <BarRow label={step.label} value={step.value} max={funnel[0].value || 1} />
                {i > 0 && funnel[i - 1].value > 0 && (
                  <p className="pl-1 text-xs text-muted-foreground">
                    {Math.round((step.value / funnel[i - 1].value) * 100)}% del paso anterior
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitas por día</CardTitle>
            <CardDescription>Dispositivos únicos en la página principal, últimos 14 días.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-1.5">
              {days.map((d) => {
                const max = Math.max(1, ...days.map((x) => x.value));
                return (
                  <div
                    key={d.day}
                    className="flex h-full flex-1 flex-col justify-end gap-1"
                    title={`${d.day}: ${d.value}`}
                  >
                    <span
                      className="block rounded-t bg-primary/80"
                      style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
                    />
                    <span className="text-center text-[10px] text-muted-foreground">{Number(d.day.slice(8))}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Países</CardTitle>
            <CardDescription>
              {allDevices ? `${Math.round((mobile / allDevices) * 100)}% desde el celular.` : "Todavía sin visitas."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {countries.map((c) => (
              <BarRow key={c.code} label={countryName(c.code)} value={c.value} max={countries[0]?.value || 1} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avisos en este dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <PushNotificationsCard
              scope="/admin"
              appName="Lazo de Oro"
              description="Te avisamos cuando una pareja publica su invitación y si hay errores en el servidor."
              save={saveAdminPush}
              remove={removeAdminPush}
              test={testAdminPush}
              deviceCount={devices ?? 0}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
