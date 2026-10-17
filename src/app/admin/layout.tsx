import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/brand/logo";
import { LogOutIcon } from "lucide-react";

import { signOut } from "@/app/panel/actions";
import { Button } from "@/components/ui/button";
import { getPlatformAdmin } from "@/lib/platform-admin";

import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: { template: "%s · Administración · Lazo de Oro", default: "Administración · Lazo de Oro" },
  robots: { index: false, follow: false },
};

/** The platform's back office. Every page and action checks the admin role again. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Link href="/admin" className="mb-6 grid gap-1 px-3">
          <Logo markClassName="size-6" />
          <span className="text-xs tracking-[0.25em] text-muted-foreground uppercase">Administración</span>
        </Link>
        <Suspense>
          <AdminNav />
        </Suspense>
        <div className="mt-auto border-t pt-4">
          <Suspense>
            <AdminAccount />
          </Suspense>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 grid gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <Logo markClassName="size-6" />
            <SignOutButton compact />
          </div>
          <Suspense>
            <AdminNav horizontal />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

async function AdminAccount() {
  const { email } = await getPlatformAdmin();
  return (
    <div className="grid gap-2">
      <p className="truncate px-3 text-xs text-muted-foreground" title={email}>
        {email}
      </p>
      <SignOutButton />
    </div>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size={compact ? "sm" : "default"}
        className={compact ? "" : "w-full justify-start gap-3"}
      >
        <LogOutIcon /> Salir
      </Button>
    </form>
  );
}
