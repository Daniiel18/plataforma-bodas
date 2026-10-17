import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BlockSkeleton, PageHeader } from "@/app/panel/(panel)/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformAdmin } from "@/lib/platform-admin";

import { formatDate } from "../ui";

export const metadata: Metadata = { title: "Errores y auditoría" };

export default function LogPage() {
  return (
    <>
      <PageHeader
        title="Errores y auditoría"
        description="Los últimos errores del servidor y las acciones sensibles de la plataforma."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<BlockSkeleton className="h-96" />}>
          <Errors />
        </Suspense>
        <Suspense fallback={<BlockSkeleton className="h-96" />}>
          <Audit />
        </Suspense>
      </div>
    </>
  );
}

async function Errors() {
  const { db } = await getPlatformAdmin();
  const { data } = await db
    .from("error_log")
    .select("id, occurred_at, source, message, path")
    .order("occurred_at", { ascending: false })
    .limit(100);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Errores</CardTitle>
        <CardDescription>Los registra el servidor al fallar una página, una acción o una ruta.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {(data ?? []).map((e) => (
          <div key={e.id} className="grid gap-1 border-b pb-3 last:border-0">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {e.path} · {e.source}
              </span>
              <span>{formatDate(e.occurred_at, true)}</span>
            </div>
            <p className="font-mono text-xs break-words">{e.message}</p>
          </div>
        ))}
        {!data?.length && <p className="text-muted-foreground">Sin errores registrados. 🎉</p>}
      </CardContent>
    </Card>
  );
}

const ACTIONS: Record<string, string> = {
  "wedding.created_from_builder": "Creó su boda desde el creador",
  "wedding.design_replaced": "Reemplazó el diseño",
  "wedding.published": "Publicó por primera vez",
  "wedding.suspended": "Suspendió una boda",
  "wedding.reactivated": "Reactivó una boda",
  "wedding.deleted": "Eliminó una boda",
  "account.deleted": "Eliminó una cuenta",
  "account.marked_test": "Marcó una cuenta como de prueba",
  "account.marked_real": "Marcó una cuenta como real",
  "account.password_set": "Puso la contraseña de una cuenta de prueba",
};

async function Audit() {
  const { db } = await getPlatformAdmin();
  const [{ data }, users] = await Promise.all([
    db
      .from("audit_log")
      .select("id, created_at, actor_user_id, action, target_type, target_id, details")
      .order("created_at", { ascending: false })
      .limit(100),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emails = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoría</CardTitle>
        <CardDescription>Quién hizo qué y cuándo.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {(data ?? []).map((a) => (
          <div key={a.id} className="grid gap-1 border-b pb-3 last:border-0">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">{ACTIONS[a.action] ?? a.action}</span>
              <span className="text-xs text-muted-foreground">{formatDate(a.created_at, true)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {a.actor_user_id ? (emails.get(a.actor_user_id) ?? "cuenta borrada") : "la plataforma"}
              {a.target_type === "wedding" && a.target_id && (
                <>
                  {" · "}
                  <Link href={`/admin/bodas/${a.target_id}`} className="underline-offset-4 hover:underline">
                    ver boda
                  </Link>
                </>
              )}
              {a.details?.reason ? ` · ${a.details.reason}` : ""}
              {a.details?.slug ? ` · /${a.details.slug}` : ""}
              {a.details?.email ? ` · ${a.details.email}` : ""}
            </p>
          </div>
        ))}
        {!data?.length && <p className="text-muted-foreground">Sin acciones registradas.</p>}
      </CardContent>
    </Card>
  );
}
