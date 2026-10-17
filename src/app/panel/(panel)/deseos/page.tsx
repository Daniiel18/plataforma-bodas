import type { Metadata } from "next";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminContext, getUnreadWishesCount } from "@/lib/admin";
import { displayZone, formatDateTime } from "@/lib/dates";
import type { Wish } from "@/lib/types";
import { cn } from "@/lib/utils";

import { BlockSkeleton, PageHeader } from "../page-header";
import { MarkAllReadButton, WishApproveToggle, WishReadToggle } from "./wish-controls";

export const metadata: Metadata = { title: "Deseos" };

type WishRow = Wish & { rsvps: { full_name: string; attending: boolean; is_archived: boolean } | null };

export default function WishesPage() {
  return (
    <>
      <PageHeader
        title="Deseos"
        description="Mensajes que dejan los invitados al responder. Son privados, salvo los que ustedes muestren en la invitación (actívenlo en Ajustes)."
        actions={
          <Suspense fallback={null}>
            <MarkAllRead />
          </Suspense>
        }
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            <BlockSkeleton className="h-40" />
            <BlockSkeleton className="h-40" />
          </div>
        }
      >
        <WishList />
      </Suspense>
    </>
  );
}

async function MarkAllRead() {
  const unread = await getUnreadWishesCount();
  return unread > 0 ? <MarkAllReadButton /> : null;
}

async function WishList() {
  const { supabase, wedding } = await getAdminContext();
  const { data, error } = await supabase
    .from("wishes")
    .select("*, rsvps(full_name, attending, is_archived)")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false });

  const wishes = (data ?? []) as WishRow[];
  const zone = displayZone(wedding.timezone);

  if (error) return <p className="text-sm text-destructive">No se pudieron cargar los deseos.</p>;

  if (wishes.length === 0) {
    return (
      <Card className="items-center p-10 text-center text-sm text-muted-foreground">
        Todavía no hay deseos. Aparecerán aquí cuando los invitados respondan.
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {wishes.map((w) => (
        <li key={w.id}>
          <Card className={cn("h-full", !w.is_read && "border-ring bg-accent/40")}>
            <CardContent className="grid h-full gap-4">
              <blockquote className="font-heading text-xl leading-snug whitespace-pre-line">“{w.message}”</blockquote>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="grid">
                  <span className="font-medium">{w.rsvps?.full_name ?? "Invitado"}</span>
                  <span className="text-muted-foreground">{formatDateTime(w.created_at, zone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {w.rsvps &&
                    (w.rsvps.attending ? <Badge>Asiste</Badge> : <Badge variant="secondary">No asiste</Badge>)}
                  {w.locale === "en" && <Badge variant="outline">EN</Badge>}
                  {w.approved_at && wedding.guestbook_public && <Badge variant="outline">En la invitación</Badge>}
                  <WishReadToggle wishId={w.id} isRead={w.is_read} />
                  <WishApproveToggle wishId={w.id} approved={Boolean(w.approved_at)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
