import type { Metadata } from "next";
import { Suspense } from "react";

import { getAdminContext } from "@/lib/admin";
import { MEDIA_LIMITS, publicMediaUrl } from "@/lib/media";
import { parseContent } from "@/lib/sections";

import { BlockSkeleton, PageHeader } from "../page-header";
import { GalleryManager } from "./gallery-manager";

export const metadata: Metadata = { title: "Galería" };

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Galería"
        description={`Hasta ${MEDIA_LIMITS.gallery} fotos. Arrástralas para cambiar el orden y elige cómo se ven en la invitación.`}
      />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <GalleryLoader />
      </Suspense>
    </>
  );
}

async function GalleryLoader() {
  const { supabase, wedding } = await getAdminContext();
  const [{ data: media }, { data: section }] = await Promise.all([
    supabase
      .from("media")
      .select("id, storage_path, width, height, caption")
      .eq("wedding_id", wedding.id)
      .eq("kind", "gallery")
      .order("position"),
    supabase.from("sections").select("content, is_visible").eq("wedding_id", wedding.id).eq("type", "gallery").single(),
  ]);

  const photos = (media ?? []).map((m) => ({
    id: m.id as string,
    url: publicMediaUrl(m.storage_path),
    width: m.width ?? 1200,
    height: m.height ?? 1600,
    caption: (m.caption as string | null) ?? "",
  }));

  return (
    <GalleryManager
      key={photos.map((p) => p.id).join(",")}
      weddingId={wedding.id}
      photos={photos}
      settings={parseContent("gallery", section?.content)}
      visible={section?.is_visible ?? true}
    />
  );
}
