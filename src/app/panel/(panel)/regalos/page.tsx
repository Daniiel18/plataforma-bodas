import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminContext } from "@/lib/admin";
import { publicMediaUrl } from "@/lib/media";
import { parseContent } from "@/lib/sections";

import { BlockSkeleton, PageHeader } from "../page-header";
import { SingleMediaField } from "../single-media-field";
import { GiftsTextForm, ZelleForm } from "./gift-forms";

export const metadata: Metadata = { title: "Regalos" };

export default function GiftsPage() {
  return (
    <>
      <PageHeader
        title="Regalos"
        description="Caja de regalos con Zelle: los invitados la tocan para ver el QR y tus datos."
      />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <GiftsLoader />
      </Suspense>
    </>
  );
}

async function GiftsLoader() {
  const { supabase, wedding } = await getAdminContext();
  const [{ data: zelle }, { data: section }, { data: qr }] = await Promise.all([
    supabase
      .from("gift_methods")
      .select("holder_name, handle, note, is_visible")
      .eq("wedding_id", wedding.id)
      .eq("type", "zelle")
      .single(),
    supabase.from("sections").select("content").eq("wedding_id", wedding.id).eq("type", "gifts").single(),
    supabase
      .from("media")
      .select("id, storage_path, width, height")
      .eq("wedding_id", wedding.id)
      .eq("kind", "qr")
      .maybeSingle(),
  ]);

  const texts = parseContent("gifts", section?.content);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Código QR de Zelle</CardTitle>
          <CardDescription>
            Ábrelo en la app de tu banco (Zelle → Recibir → Código QR), toma una captura y súbela aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SingleMediaField
            weddingId={wedding.id}
            kind="qr"
            current={
              qr ? { id: qr.id, url: publicMediaUrl(qr.storage_path), width: qr.width, height: qr.height } : null
            }
            emptyLabel="Subir QR de Zelle"
            hint="Recorta la captura para que solo se vea el código; así se escanea mejor."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Zelle</CardTitle>
          <CardDescription>Se muestran debajo del QR, con un botón para copiar.</CardDescription>
        </CardHeader>
        <CardContent>
          <ZelleForm
            initial={{
              holder_name: zelle?.holder_name ?? "",
              handle: zelle?.handle ?? "",
              note: zelle?.note ?? "",
              is_visible: zelle?.is_visible ?? true,
            }}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Textos de la sección</CardTitle>
          <CardDescription>Se traducen solos al inglés al guardar.</CardDescription>
        </CardHeader>
        <CardContent>
          <GiftsTextForm initial={texts} />
        </CardContent>
      </Card>
    </div>
  );
}
