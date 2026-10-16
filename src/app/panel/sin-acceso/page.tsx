import Link from "next/link";

import { Button } from "@/components/ui/button";

import { signOut } from "../actions";
import { AuthCard } from "../auth-card";

/** Signed in, but the account has no wedding yet (it is created by publishing from the builder). */
export default function NoAccessPage() {
  return (
    <AuthCard
      title="Todavía no tienes una boda"
      description="Diseña tu invitación paso a paso y publícala; tu panel se crea al publicar. Si alguien te invitó a ver una boda, pídele que te dé acceso."
    >
      <div className="grid gap-2">
        <Button asChild className="w-full">
          <Link href="/crear">Crear mi invitación</Link>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            Salir
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
