import "server-only";

import webpush from "web-push";

import { composeNotice, type CoupleNotice } from "@/lib/notice";
import { createAdminClient } from "@/lib/supabase/admin";

export type { CoupleNotice };

function configured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://invitacion-bodas.vercel.app", publicKey, privateKey);
  return true;
}

/**
 * Notifies the couple on their phones (Web Push). Subscriptions the browser
 * no longer accepts (404/410) are removed. Returns how many were delivered.
 */
export async function notifyCouple(weddingId: string, notice: CoupleNotice): Promise<number> {
  if (!configured()) return 0;

  const db = createAdminClient();
  const { data: subscriptions } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("wedding_id", weddingId);
  if (!subscriptions?.length) return 0;

  const payload = JSON.stringify(composeNotice(notice));
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
