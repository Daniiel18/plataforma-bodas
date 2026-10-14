import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar al panel" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <AuthCard
      title="Panel de los novios"
      description="Entra con la cuenta compartida de la boda."
      footer={
        <Link href="/admin/recuperar" className="text-muted-foreground underline-offset-4 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      }
    >
      <Suspense fallback={null}>
        <LinkError searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </AuthCard>
  );
}

async function LinkError({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { error } = await searchParams;
  if (error !== "enlace") return null;
  return (
    <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      El enlace expiró o no es válido. Pide uno nuevo.
    </p>
  );
}
