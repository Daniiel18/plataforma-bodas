import type { Metadata } from "next";
import { Suspense } from "react";

import { safeNext } from "@/lib/auth-redirect";

import { SignIn } from "./sign-in";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entra con Google o con un código por correo para publicar tu invitación y ver tus confirmaciones.",
  robots: { index: false, follow: false },
};

export default function SignInPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <Suspense>
      <SignInWithParams searchParams={searchParams} />
    </Suspense>
  );
}

async function SignInWithParams({ searchParams }: Pick<PageProps<"/entrar">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  return <SignIn next={next} linkError={params.error === "enlace"} />;
}
