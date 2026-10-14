"use client";

import {
  EyeIcon,
  FileTextIcon,
  GiftIcon,
  HeartIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MusicIcon,
  PaletteIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: LucideIcon } & (
  { href: string; stage?: never } | { href?: never; stage: number }
);

const NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboardIcon },
  { href: "/admin/invitados", label: "Invitados", icon: UsersIcon },
  { href: "/admin/deseos", label: "Deseos", icon: HeartIcon },
  { href: "/admin/contenido", label: "Contenido", icon: FileTextIcon },
  { href: "/admin/galeria", label: "Galería", icon: ImagesIcon },
  { href: "/admin/musica", label: "Música", icon: MusicIcon },
  { href: "/admin/regalos", label: "Regalos", icon: GiftIcon },
  { href: "/admin/apariencia", label: "Apariencia", icon: PaletteIcon },
  { href: "/admin/ajustes", label: "Ajustes", icon: SettingsIcon },
];

function NavLinks({ unreadWishes, onNavigate }: { unreadWishes: number; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        if (!item.href) {
          return (
            <span
              key={item.label}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
              title={`Disponible en la Etapa ${item.stage}`}
            >
              <Icon className="size-4" />
              {item.label}
              <span className="ml-auto text-[10px] tracking-wide uppercase">Etapa {item.stage}</span>
            </span>
          );
        }
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
              active && "bg-sidebar-accent font-medium",
            )}
          >
            <Icon className="size-4" />
            {item.label}
            {item.href === "/admin/deseos" && unreadWishes > 0 && <Badge className="ml-auto">{unreadWishes}</Badge>}
          </Link>
        );
      })}
      <Link
        href="/admin/vista-previa"
        onClick={onNavigate}
        className="mt-3 flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
      >
        <EyeIcon className="size-4" />
        Ver invitación
      </Link>
    </nav>
  );
}

export function SidebarNav({ unreadWishes }: { unreadWishes: number }) {
  return <NavLinks unreadWishes={unreadWishes} />;
}

export function MobileNav({ unreadWishes, title }: { unreadWishes: number; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl font-medium">{title}</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <NavLinks unreadWishes={unreadWishes} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
