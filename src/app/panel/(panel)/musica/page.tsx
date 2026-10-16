import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminContext } from "@/lib/admin";
import { publicMediaUrl } from "@/lib/media";
import { parseContent } from "@/lib/sections";

import { BlockSkeleton, PageHeader } from "../page-header";
import { SingleMediaField } from "../single-media-field";
import { MusicSettings } from "./music-settings";

export const metadata: Metadata = { title: "Música" };

export default function MusicPage() {
  return (
    <>
      <PageHeader title="Música" description="La canción que suena de fondo cuando los invitados abren el sobre." />
      <Suspense fallback={<BlockSkeleton className="h-64" />}>
        <MusicLoader />
      </Suspense>
    </>
  );
}

async function MusicLoader() {
  const { supabase, wedding } = await getAdminContext();
  const [{ data: audio }, { data: section }] = await Promise.all([
    supabase.from("media").select("id, storage_path").eq("wedding_id", wedding.id).eq("kind", "audio").maybeSingle(),
    supabase.from("sections").select("content, is_visible").eq("wedding_id", wedding.id).eq("type", "music").single(),
  ]);

  return (
    <div className="grid max-w-2xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Canción</CardTitle>
          <CardDescription>Formato MP3 o M4A, hasta 15 MB. Si subes otra, reemplaza a la anterior.</CardDescription>
        </CardHeader>
        <CardContent>
          <SingleMediaField
            weddingId={wedding.id}
            kind="audio"
            current={
              audio ? { id: audio.id, url: publicMediaUrl(audio.storage_path), width: null, height: null } : null
            }
            emptyLabel="Subir canción"
            hint="Consejo: una versión MP3 de 4–6 MB carga rápido incluso con datos móviles."
          />
        </CardContent>
      </Card>
      <MusicSettings
        autoplayOnOpen={parseContent("music", section?.content).autoplay_on_open}
        visible={section?.is_visible ?? true}
      />
    </div>
  );
}
