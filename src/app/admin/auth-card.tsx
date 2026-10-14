import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Tarjeta centrada para las pantallas de acceso (login, recuperar, sin acceso). */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="font-heading text-sm tracking-[0.3em] text-muted-foreground uppercase">❦</p>
          <CardTitle className="font-heading text-3xl font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {children}
          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </CardContent>
      </Card>
    </main>
  );
}
