import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getAdminContext, getUnreadWishesCount } from "@/lib/admin";

import { signOut } from "../actions";
import { MobileNav, SidebarNav } from "./admin-nav";
import { LiveUpdates } from "./live-updates";

export const metadata: Metadata = {
  title: { template: "%s · Panel de la boda", default: "Panel de la boda" },
  robots: { index: false, follow: false },
};

// The shell paints instantly; session-dependent content streams in.
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <Suspense fallback={<div className="h-6 w-40 animate-pulse rounded bg-muted" />}>
            <MobileHeader />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
      <Suspense>
        <Live />
      </Suspense>
    </div>
  );
}

async function Live() {
  const { wedding } = await getAdminContext();
  return <LiveUpdates weddingId={wedding.id} />;
}

function coupleTitle(partner1: string, partner2: string) {
  return `${partner1.split(" ")[0]} & ${partner2.split(" ")[0]}`;
}

function DemoBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-900 uppercase">
      Demo · solo lectura
    </span>
  );
}

async function Sidebar() {
  const { wedding, email, readOnly } = await getAdminContext();
  const unreadWishes = await getUnreadWishesCount();

  return (
    <>
      <div className="mb-6 px-3">
        <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">Panel</p>
        <p className="font-heading text-2xl">{coupleTitle(wedding.partner1_name, wedding.partner2_name)}</p>
        {readOnly && <DemoBadge />}
      </div>
      <SidebarNav unreadWishes={unreadWishes} />
      <div className="mt-auto grid gap-2 border-t pt-4">
        <p className="truncate px-3 text-xs text-muted-foreground" title={email}>
          {email}
        </p>
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start gap-3">
            <LogOutIcon /> Salir
          </Button>
        </form>
      </div>
    </>
  );
}

async function MobileHeader() {
  const { wedding, readOnly } = await getAdminContext();
  const unreadWishes = await getUnreadWishesCount();
  const title = coupleTitle(wedding.partner1_name, wedding.partner2_name);

  return (
    <>
      <MobileNav unreadWishes={unreadWishes} title={title} />
      <p className="font-heading text-xl">{title}</p>
      {readOnly && <DemoBadge />}
      <form action={signOut} className="ml-auto">
        <Button type="submit" variant="ghost" size="icon" aria-label="Salir">
          <LogOutIcon />
        </Button>
      </form>
    </>
  );
}

function SidebarSkeleton() {
  return (
    <div className="grid gap-3 px-3">
      <div className="mb-4 h-10 w-36 animate-pulse rounded bg-muted" />
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="h-6 animate-pulse rounded bg-muted/70" />
      ))}
    </div>
  );
}
