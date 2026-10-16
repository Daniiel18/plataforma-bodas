import type { Metadata } from "next";
import { Suspense } from "react";

import { Builder } from "./builder";

export const metadata: Metadata = {
  title: "Crea tu invitación de boda gratis",
  description:
    "Diseña paso a paso la web de tu boda, sin cuenta: plantilla, fotos, música, mapa, programa y confirmación de asistencia. Gratis.",
  alternates: { canonical: "/crear" },
};

export default function CreatePage() {
  return (
    <Suspense
      fallback={<div className="flex flex-1 items-center justify-center p-10 text-muted-foreground">Cargando…</div>}
    >
      <Builder />
    </Suspense>
  );
}
