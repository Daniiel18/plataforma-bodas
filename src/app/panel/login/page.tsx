import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { safeNext } from "@/lib/auth-redirect";

import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar con contraseña", robots: { index: false, follow: false } };

/** Password sign-in, kept for the read-only demo and accounts created before Google and email codes. */
export default function LoginPage({ searchParams }: PageProps<"/panel/login">) {
  return (
    <AuthCard
      title="Entrar con contraseña"
      description="Para la cuenta de demostración y las cuentas con contraseña."
      footer={
        <div className="grid gap-1 text-center">
          <Link href="/entrar" className="text-muted-foreground underline-offset-4 hover:underline">
            Entrar con Google o con un código por correo
          </Link>
          <Link href="/panel/recuperar" className="text-muted-foreground underline-offset-4 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      }
    >
      <Suspense fallback={<LoginForm next="/panel" />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginWithNext({ searchParams }: Pick<PageProps<"/panel/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(typeof next === "string" ? next : null)} />;
}
