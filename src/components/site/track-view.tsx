"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics";

/** Records a page view once (skipped inside the landing page's phone preview). */
export function TrackView({ name, template }: { name: "landing_view" | "demo_view"; template?: string }) {
  useEffect(() => {
    if (window.self !== window.top) return;
    track(name, template ? { template } : undefined);
  }, [name, template]);
  return null;
}
