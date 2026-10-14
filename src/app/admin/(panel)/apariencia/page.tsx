import type { Metadata } from "next";
import { Suspense } from "react";

import { getAdminContext } from "@/lib/admin";
import { resolveAccent, resolveTemplate } from "@/lib/templates";

import { BlockSkeleton, PageHeader } from "../page-header";
import { AppearanceEditor } from "./appearance-editor";

export const metadata: Metadata = { title: "Apariencia" };

export default function AppearancePage() {
  return (
    <>
      <PageHeader title="Apariencia" description="Elige el estilo de la invitación. Puedes cambiarlo cuando quieras." />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <AppearanceLoader />
      </Suspense>
    </>
  );
}

async function AppearanceLoader() {
  const { wedding } = await getAdminContext();
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;

  return (
    <AppearanceEditor
      template={resolveTemplate(wedding.template_key)}
      accent={resolveAccent(wedding.theme_overrides)}
      couple={`${first(wedding.partner1_name)} & ${first(wedding.partner2_name)}`}
    />
  );
}
