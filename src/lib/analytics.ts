/**
 * Sends a product event (see /api/events). No cookies: a random id is kept in
 * localStorage. Nothing is sent when the browser asks not to be tracked.
 */

type EventName =
  "landing_view" | "demo_view" | "builder_start" | "builder_step" | "builder_review" | "publish_click" | "save_click";

const ID_KEY = "lazodoro-aid";

function anonymousId(): string | null {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function track(name: EventName, properties?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
  const id = anonymousId();
  if (!id) return;

  const params = new URLSearchParams(window.location.search);
  const utm = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
  };
  const body = JSON.stringify({
    name,
    anonymousId: id,
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    utm,
    properties,
  });
  const sent = navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }));
  if (!sent)
    void fetch("/api/events", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    });
}
