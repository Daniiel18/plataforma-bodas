import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminContext } from "@/lib/admin";
import { rowsToGifts, type GiftRow } from "@/lib/gifts";
import { publicMediaUrl } from "@/lib/media";
import { parseContent } from "@/lib/sections";

import { BlockSkeleton, PageHeader } from "../page-header";
import { SingleMediaField } from "../single-media-field";
import { GiftMethodsForm, GiftsTextForm, GiftsVisibleSwitch } from "./gift-forms";

export const metadata: Metadata = { title: "Regalos" };

export default function GiftsPage() {
  return (
    <>
      <PageHeader
        title="Regalos"
        description="Una caja de regalo que tus invitados tocan para ver cómo enviarte un regalo: Zelle, PayPal, transferencia o tu mesa de regalos."
      />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <GiftsLoader />
      </Suspense>
    </>
  );
}

async function GiftsLoader() {
  const { supabase, wedding } = await getAdminContext();
  const [{ data: gifts }, { data: section }, { data: qr }] = await Promise.all([
    supabase
      .from("gift_methods")
      .select("type, holder_name, handle, note, details, is_visible")
      .eq("wedding_id", wedding.id),
    supabase.from("sections").select("content, is_visible").eq("wedding_id", wedding.id).eq("type", "gifts").single(),
    supabase
      .from("media")
      .select("id, storage_path, width, height")
      .eq("wedding_id", wedding.id)
      .eq("kind", "qr")
      .maybeSingle(),
  ]);

  const texts = parseContent("gifts", section?.content);

  return (
    <div className="grid gap-6">
      <GiftsVisibleSwitch initial={section?.is_visible ?? true} />

      <Card>
        <CardHeader>
          <CardTitle>Textos de la sección</CardTitle>
          <CardDescription>Se traducen solos al inglés al guardar.</CardDescription>
        </CardHeader>
        <CardContent>
          <GiftsTextForm initial={texts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formas de recibir regalos</CardTitle>
          <CardDescription>
            Activa las que quieras. La invitación solo muestra las que tienen sus datos completos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GiftMethodsForm
            initial={rowsToGifts((gifts ?? []) as GiftRow[])}
            qrField={
              <SingleMediaField
                weddingId={wedding.id}
                kind="qr"
                current={
                  qr ? { id: qr.id, url: publicMediaUrl(qr.storage_path), width: qr.width, height: qr.height } : null
                }
                emptyLabel="Subir QR de Zelle"
                hint="Ábrelo en la app de tu banco (Zelle → Recibir → Código QR), toma una captura y recórtala para que solo se vea el código."
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
