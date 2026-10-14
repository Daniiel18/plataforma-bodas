import { Button } from "@/components/ui/button";

import { signOut } from "../actions";
import { AuthCard } from "../auth-card";

export default function NoAccessPage() {
  return (
    <AuthCard
      title="Sin acceso"
      description="Esta cuenta todavía no administra ninguna boda. Pide al administrador de la plataforma que te dé acceso."
    >
      <form action={signOut}>
        <Button type="submit" variant="outline" className="w-full">
          Salir
        </Button>
      </form>
    </AuthCard>
  );
}
