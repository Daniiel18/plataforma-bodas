"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type RsvpRow = { id: string; full_name: string; attending: boolean; edit_token_hash: string | null };
type WishRow = { id: string; rsvp_id: string; message: string };

type Pending = {
  answers: Map<string, { row: RsvpRow; change: boolean }>;
  wishes: Map<string, WishRow>;
};

const quote = (text: string) => `“${text.length > 140 ? `${text.slice(0, 139)}…` : text}”`;

/**
 * Keeps the dashboard live. Guests' answers and wishes arrive through Supabase
 * Realtime, appear as in-app notifications and refresh the current page, so
 * the couple never has to reload. Rows added from the dashboard itself (no
 * guest token) only refresh the page.
 */
export function LiveUpdates({ weddingId }: { weddingId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const pending: Pending = { answers: new Map(), wishes: new Map() };
    let timer: ReturnType<typeof setTimeout> | undefined;

    const notify = async () => {
      const answers = [...pending.answers.values()];
      const wishes = [...pending.wishes.values()];
      pending.answers.clear();
      pending.wishes.clear();

      for (const { row, change } of answers) {
        const wish = wishes.find((w) => w.rsvp_id === row.id);
        if (wish) wishes.splice(wishes.indexOf(wish), 1);
        if (!row.edit_token_hash) continue;

        if (change) {
          toast(`🔄 ${row.full_name} cambió su respuesta`, {
            description: row.attending ? "Ahora asistirá" : "Ahora no asistirá",
            action: { label: "Ver", onClick: () => router.push("/panel/invitados") },
            duration: 10000,
          });
          continue;
        }

        const { data: companions } = await supabase
          .from("rsvp_companions")
          .select("full_name")
          .eq("rsvp_id", row.id)
          .order("position");
        const names = (companions ?? []).map((c) => c.full_name as string);
        const answer = row.attending
          ? names.length
            ? `${names.length + 1} personas: ${row.full_name}, ${names.join(", ")}`
            : "Asistirá sin acompañantes"
          : "Respondió que no asistirá";
        toast(row.attending ? `✅ ${row.full_name} confirmó` : `✉️ ${row.full_name} no podrá asistir`, {
          description: wish ? `${answer} · 💌 ${quote(wish.message)}` : answer,
          action: { label: "Ver", onClick: () => router.push(wish ? "/panel/deseos" : "/panel/invitados") },
          duration: 10000,
        });
      }

      for (const wish of wishes) {
        const { data } = await supabase.from("rsvps").select("full_name").eq("id", wish.rsvp_id).maybeSingle();
        toast(`💌 Deseo de ${data?.full_name ?? "un invitado"}`, {
          description: quote(wish.message),
          action: { label: "Ver", onClick: () => router.push("/panel/deseos") },
          duration: 10000,
        });
      }

      router.refresh();
    };

    // An answer and its wish arrive as separate events: group them briefly.
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void notify(), 1200);
    };

    const filter = `wedding_id=eq.${weddingId}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    // Realtime applies Row Level Security with the token it joined with, so it
    // must carry the couple's session (as anonymous it would see nothing).
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      if (!active) return;
      channel = supabase
        .channel(`wedding-${weddingId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "rsvps", filter }, (payload) => {
          const row = payload.new as RsvpRow;
          pending.answers.set(row.id, { row, change: false });
          schedule();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rsvps", filter }, (payload) => {
          const row = payload.new as RsvpRow;
          const before = payload.old as Partial<RsvpRow>;
          if (before.attending !== undefined && before.attending !== row.attending && !pending.answers.has(row.id)) {
            pending.answers.set(row.id, { row, change: true });
          }
          schedule();
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "wishes", filter }, (payload) => {
          const row = payload.new as WishRow;
          pending.wishes.set(row.id, row);
          schedule();
        })
        .subscribe();
    });

    // Back from the background (the installed app or another tab): catch up.
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [weddingId, router]);

  return null;
}
