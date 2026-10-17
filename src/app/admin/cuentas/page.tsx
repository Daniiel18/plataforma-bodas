import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BlockSkeleton, PageHeader } from "@/app/panel/(panel)/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlatformAdmin } from "@/lib/platform-admin";

import { formatDate } from "../ui";

export const metadata: Metadata = { title: "Cuentas" };

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Cuentas" description="Quién se registró, cómo entra y qué boda maneja." />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <AccountList />
      </Suspense>
    </>
  );
}

const PROVIDER: Record<string, string> = { google: "Google", email: "Correo" };

async function AccountList() {
  const { db } = await getPlatformAdmin();
  const [users, { data: members }, { data: weddings }, { data: admins }] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("wedding_members").select("user_id, wedding_id, role"),
    db.from("weddings").select("id, slug"),
    db.from("platform_admins").select("user_id"),
  ]);

  const slugs = new Map((weddings ?? []).map((w) => [w.id, w.slug]));
  const isAdmin = new Set((admins ?? []).map((a) => a.user_id));
  const accounts = [...(users.data?.users ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Correo</TableHead>
            <TableHead className="hidden sm:table-cell">Entra con</TableHead>
            <TableHead>Boda</TableHead>
            <TableHead className="hidden md:table-cell">Desde</TableHead>
            <TableHead className="hidden md:table-cell">Última vez</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((u) => {
            const memberships = (members ?? []).filter((m) => m.user_id === u.id);
            return (
              <TableRow key={u.id}>
                <TableCell className="max-w-56">
                  <p className="truncate font-medium">{u.email}</p>
                  {isAdmin.has(u.id) && <Badge variant="outline">Administración</Badge>}
                </TableCell>
                <TableCell className="hidden text-sm sm:table-cell">
                  {((u.app_metadata?.providers as string[] | undefined) ?? []).map((p) => PROVIDER[p] ?? p).join(", ")}
                </TableCell>
                <TableCell className="text-sm">
                  {memberships.length
                    ? memberships.map((m) => (
                        <Link
                          key={m.wedding_id}
                          href={`/admin/bodas/${m.wedding_id}`}
                          className="block hover:underline"
                        >
                          /{slugs.get(m.wedding_id)}
                          {m.role !== "owner" && " (lectura)"}
                        </Link>
                      ))
                    : "—"}
                </TableCell>
                <TableCell className="hidden text-sm md:table-cell">{formatDate(u.created_at)}</TableCell>
                <TableCell className="hidden text-sm md:table-cell">{formatDate(u.last_sign_in_at, true)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
