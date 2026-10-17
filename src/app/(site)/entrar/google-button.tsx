"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { GOOGLE_CLIENT_ID } from "@/lib/site";

type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    nonce: string;
    ux_mode?: "popup";
    use_fedcm_for_button?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** A random nonce and its SHA-256 (Google signs the hash; Supabase checks it against the raw value). */
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

/**
 * Google's own "Continue with Google" button. Sign-in happens on this site
 * (an ID token that Supabase verifies), so Google shows our name and domain
 * instead of the database's. If Google's script cannot load (blockers, in-app
 * browsers), `fallback` is shown instead.
 */
export function GoogleButton({
  lang,
  onToken,
  fallback,
}: {
  lang: "es" | "en";
  onToken: (token: string, nonce: string) => void;
  fallback: React.ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const handler = useRef(onToken);
  const [scriptReady, setScriptReady] = useState(() => typeof window !== "undefined" && Boolean(window.google));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    handler.current = onToken;
  });

  useEffect(() => {
    if (scriptReady) return;
    const timer = setTimeout(() => setFailed(true), 6000);
    return () => clearTimeout(timer);
  }, [scriptReady]);

  useEffect(() => {
    const el = container.current;
    const id = window.google?.accounts.id;
    if (!scriptReady || !el || !id) return;
    let cancelled = false;
    void makeNonce().then(({ raw, hashed }) => {
      if (cancelled) return;
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        ux_mode: "popup",
        use_fedcm_for_button: true,
        callback: (response) => handler.current(response.credential, raw),
      });
      el.replaceChildren();
      id.renderButton(el, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "center",
        locale: lang,
        width: Math.min(400, Math.max(220, Math.round(el.getBoundingClientRect().width))),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [scriptReady, lang]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setFailed(true)}
      />
      {failed && !scriptReady ? fallback : <div ref={container} className="flex h-11 w-full justify-center" />}
    </>
  );
}
