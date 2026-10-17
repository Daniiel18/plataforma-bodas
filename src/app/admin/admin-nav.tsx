"use client";

import {
  ActivityIcon,
  ChartColumnIcon,
  DatabaseIcon,
  HeartHandshakeIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Resumen", icon: ChartColumnIcon },
  { href: "/admin/bodas", label: "Bodas", icon: HeartHandshakeIcon },
  { href: "/admin/cuentas", label: "Cuentas", icon: UsersIcon },
  { href: "/admin/uso", label: "Uso del plan", icon: DatabaseIcon },
  { href: "/admin/registro", label: "Errores y auditoría", icon: ActivityIcon },
];

/** Back-office menu: a sidebar on computers, a scrolling row on phones. */
export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={horizontal ? "flex gap-1 overflow-x-auto" : "grid gap-1"}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap hover:bg-accent",
              active && "bg-accent font-medium",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
