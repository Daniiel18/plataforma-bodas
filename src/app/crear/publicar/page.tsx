import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

import { Publisher } from "./publisher";

export const metadata: Metadata = { title: "Publicar", robots: { index: false, follow: false } };

/** Moves the builder's draft into the couple's account and publishes it (needs a session, see proxy.ts). */
export default function PublishPage() {
  return (
    <div className="site flex flex-1 flex-col" data-lang-root>
      <header className="border-b border-[var(--site-line)]/70">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <Link href="/" aria-label="Lazo de Oro">
            <Logo markClassName="size-7" />
          </Link>
        </div>
      </header>
      <Publisher />
    </div>
  );
}
