import "server-only";

import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

export type CoupleNotice =
  | { kind: "rsvp"; name: string; attending: boolean; companions: string[] }
  | { kind: "change"; name: string; attending: boolean; companions: string[] }
  | { kind: "wish"; name: string; message: string }
  | { kind: "test" };

type Payload = { title: string; body: string; url: string; tag: string };

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

function compose(notice: CoupleNotice): Payload {
  switch (notice.kind) {
    case "rsvp": {
      const people = 1 + notice.companions.length;
      return notice.attending
        ? {
            title: `✅ ${notice.name} confirmó`,
            body: notice.companions.length
              ? `${people} personas: ${notice.name}, ${notice.companions.join(", ")}`
              : "Asistirá sin acompañantes",
            url: "/admin/invitados",
            tag: "rsvp",
          }
        : {
            title: `✉️ ${notice.name} no podrá asistir`,
            body: "Respondió que no asistirá",
            url: "/admin/invitados",
            tag: "rsvp",
          };
    }
    case "change":
      return {
        title: `🔄 ${notice.name} cambió su respuesta`,
        body: notice.attending
          ? `Ahora asistirá${notice.companions.length ? ` con ${notice.companions.join(", ")}` : ""}`
          : "Ahora no asistirá",
        url: "/admin/invitados",
        tag: "rsvp",
      };
    case "wish":
      return {
        title: `💌 Deseo de ${notice.name}`,
        body: truncate(notice.message, 160),
        url: "/admin/deseos",
        tag: "wish",
      };
    case "test":
      return {
        title: "🔔 Notificaciones activadas",
        body: "Así te avisaremos cuando alguien confirme o deje un deseo.",
        url: "/admin",
        tag: "test",
      };
  }
}

function configured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://invitacion-bodas.vercel.app", publicKey, privateKey);
  return true;
}

/**
 * Avisa a los novios en sus celulares (Web Push). Las suscripciones que el
 * navegador ya no acepta (404/410) se eliminan. Devuelve cuántos avisos llegaron.
 */
export async function notifyCouple(weddingId: string, notice: CoupleNotice): Promise<number> {
  if (!configured()) return 0;

  const db = createAdminClient();
  const { data: subscriptions } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("wedding_id", weddingId);
  if (!subscriptions?.length) return 0;

  const payload = JSON.stringify(compose(notice));
  let delivered = 0;
  const expired: string[] = [];

  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
          urgency: "high",
        });
        delivered++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(s.id);
        else console.error("Push no enviado:", status ?? (error instanceof Error ? error.message : error));
      }
    }),
  );

  if (expired.length) await db.from("push_subscriptions").delete().in("id", expired);
  if (delivered) {
    await db
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("wedding_id", weddingId)
      .not("id", "in", `(${expired.join(",") || "00000000-0000-0000-0000-000000000000"})`);
  }
  return delivered;
}
