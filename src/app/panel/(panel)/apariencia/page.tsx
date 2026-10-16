import type { Metadata } from "next";
import { Suspense } from "react";

import { getAdminContext } from "@/lib/admin";
import { chosenBackground, resolveVeil } from "@/lib/backgrounds";
import { publicMediaUrl } from "@/lib/media";
import { resolveAccent, resolveTemplate } from "@/lib/templates";

import { BlockSkeleton, PageHeader } from "../page-header";
import { AppearanceEditor } from "./appearance-editor";

export const metadata: Metadata = { title: "Plantilla" };

export default function AppearancePage() {
  return (
    <>
      <PageHeader
        title="Plantilla"
        description="Elige la plantilla, el fondo y el color de la invitación. Puedes cambiarlos cuando quieras."
      />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <AppearanceLoader />
      </Suspense>
    </>
  );
}

async function AppearanceLoader() {
  const { supabase, wedding } = await getAdminContext();
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;

  const { data: media } = await supabase
    .from("media")
    .select("id, kind, storage_path, width, height")
    .eq("wedding_id", wedding.id)
    .in("kind", ["cover", "background"]);
  const cover = media?.find((m) => m.kind === "cover");
  const background = media?.find((m) => m.kind === "background");

  return (
    <AppearanceEditor
      weddingId={wedding.id}
      couple={`${first(wedding.partner1_name)} & ${first(wedding.partner2_name)}`}
      initial={{
        template: resolveTemplate(wedding.template_key),
        accent: resolveAccent(wedding.theme_overrides),
        background: chosenBackground(wedding.theme_overrides),
        veil: resolveVeil(wedding.theme_overrides),
      }}
      cover={cover ? publicMediaUrl(cover.storage_path) : null}
      backgroundPhoto={
        background
          ? {
              id: background.id,
              url: publicMediaUrl(background.storage_path),
              width: background.width,
              height: background.height,
            }
          : null
      }
    />
  );
}
