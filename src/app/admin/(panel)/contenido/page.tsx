import type { Metadata } from "next";
import { Suspense } from "react";

import { getAdminContext } from "@/lib/admin";
import { publicMediaUrl } from "@/lib/media";
import { collectTexts, parseContent, SECTION_TYPES, type SectionType, type Translations } from "@/lib/sections";

import { BlockSkeleton, PageHeader } from "../page-header";
import { ContentEditor, type EditorSection } from "./content-editor";

export const metadata: Metadata = { title: "Contenido" };

export default function ContentPage() {
  return (
    <>
      <PageHeader
        title="Contenido"
        description="Escribe en español: al guardar se traduce solo al inglés. Puedes ocultar secciones y cambiar su orden."
      />
      <Suspense fallback={<BlockSkeleton className="h-[32rem]" />}>
        <ContentLoader />
      </Suspense>
    </>
  );
}

async function ContentLoader() {
  const { supabase, wedding } = await getAdminContext();
  const [{ data: rows }, { data: cover }] = await Promise.all([
    supabase
      .from("sections")
      .select("type, position, is_visible, content, content_en")
      .eq("wedding_id", wedding.id)
      .order("position"),
    supabase
      .from("media")
      .select("id, storage_path, width, height")
      .eq("wedding_id", wedding.id)
      .eq("kind", "cover")
      .maybeSingle(),
  ]);

  const sections: EditorSection[] = (rows ?? [])
    .filter((r) => SECTION_TYPES.includes(r.type as SectionType))
    .map((r) => {
      const type = r.type as SectionType;
      const content = parseContent(type, r.content);
      const translations = (r.content_en ?? {}) as Translations;
      return {
        type,
        visible: r.is_visible as boolean,
        content,
        translations: collectTexts(type, content).map(({ path, text }) => {
          const entry = translations[path];
          const valid = entry && entry.src === text;
          return { path, es: text, en: valid ? entry.en : null, manual: Boolean(valid && entry.manual) };
        }),
      };
    });

  return (
    <ContentEditor
      key={JSON.stringify(rows?.map((r) => [r.type, r.position, r.is_visible]))}
      weddingId={wedding.id}
      sections={sections}
      cover={
        cover
          ? { id: cover.id, url: publicMediaUrl(cover.storage_path), width: cover.width, height: cover.height }
          : null
      }
      hasEventDate={Boolean(wedding.event_starts_at && wedding.timezone)}
    />
  );
}
