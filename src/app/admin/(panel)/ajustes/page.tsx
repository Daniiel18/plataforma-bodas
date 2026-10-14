import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminContext } from "@/lib/admin";
import { dateToZonedInput } from "@/lib/dates";

import { BlockSkeleton, PageHeader } from "../page-header";
import { NotificationsCard } from "./notifications-card";
import { PasswordForm } from "./password-form";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Ajustes" };

export default function SettingsPage({ searchParams }: PageProps<"/admin/ajustes">) {
  return (
    <>
      <PageHeader title="Ajustes" description="Datos principales de la boda y de la cuenta." />

      <Suspense fallback={null}>
        <RecoveryNotice searchParams={searchParams} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>La boda</CardTitle>
            <CardDescription>
              Estos datos se usan en la invitación, la cuenta regresiva y el calendario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<BlockSkeleton className="h-96" />}>
              <WeddingSettings />
            </Suspense>
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card id="avisos">
            <CardHeader>
              <CardTitle>Avisos en el celular</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<BlockSkeleton className="h-24" />}>
                <Notifications />
              </Suspense>
            </CardContent>
          </Card>

          <Card id="contrasena">
            <CardHeader>
              <CardTitle>Contraseña</CardTitle>
              <CardDescription>
                <Suspense fallback="Cuenta compartida">
                  <AccountEmail />
                </Suspense>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

async function RecoveryNotice({ searchParams }: Pick<PageProps<"/admin/ajustes">, "searchParams">) {
  const { recuperacion } = await searchParams;
  if (!recuperacion) return null;
  return (
    <p className="mb-6 rounded-lg bg-accent px-4 py-3 text-sm">
      Entraste con el enlace de recuperación. Crea tu nueva contraseña abajo.
    </p>
  );
}

async function Notifications() {
  const { supabase, wedding } = await getAdminContext();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id);
  return <NotificationsCard deviceCount={count ?? 0} />;
}

async function AccountEmail() {
  const { email } = await getAdminContext();
  return <>Cuenta compartida: {email}</>;
}

async function WeddingSettings() {
  const { wedding } = await getAdminContext();
  const zoned = (date: string | null) => (date && wedding.timezone ? dateToZonedInput(date, wedding.timezone) : "");

  return (
    <SettingsForm
      wedding={{
        slug: wedding.slug,
        partner1_name: wedding.partner1_name,
        partner2_name: wedding.partner2_name,
        event_local: zoned(wedding.event_starts_at),
        timezone: wedding.timezone ?? "",
        deadline_local: zoned(wedding.rsvp_deadline),
        max_companions: wedding.max_companions,
        is_published: wedding.is_published,
      }}
    />
  );
}
