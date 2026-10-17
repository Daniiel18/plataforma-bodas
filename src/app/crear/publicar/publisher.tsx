"use client";

import {
  CheckCircle2Icon,
  CloudCheckIcon,
  EyeIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  Loader2Icon,
  Share2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LazoMark } from "@/components/brand/logo";
import { ShareInvitationDialog } from "@/components/share-invitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuilderDraft, LocalMedia } from "@/lib/builder/draft";
import { normalizeSlugInput, SAVE_PATH, slugProblem, suggestSlug } from "@/lib/builder/draft";
import { draftMediaIds } from "@/lib/builder/invitation";
import { readLocalMedia, removeLocalMedia } from "@/lib/builder/media";
import { useBuilder } from "@/lib/builder/store";
import type { MediaKind } from "@/lib/media";
import type { Prepared } from "@/lib/media-prepare";
import { uploadPrepared } from "@/lib/media-upload";
import type { ShareDetails } from "@/lib/share";
import { SITE_URL } from "@/lib/site";

import { finishPublishing, prepareWedding, type PrepareResult } from "./actions";

const EXTENSION: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "m4a",
  "audio/ogg": "ogg",
};

type Phase =
  | { name: "preparing" }
  | { name: "uploading"; done: number; total: number }
  | { name: "publishing" }
  | { name: "choose"; slug: string; couple: string }
  | { name: "slug"; suggestion: string | null }
  | { name: "error"; message: string }
  | { name: "done"; slug: string; share: ShareDetails; failedUploads: number }
  | { name: "saved"; failedUploads: number }
  | { name: "empty" };

/** Files of the draft in upload order (single files first, then the gallery). */
function uploads(draft: BuilderDraft): { kind: MediaKind; media: LocalMedia }[] {
  const { cover, background, audio, qr, gallery } = draft.media;
  return [
    ...(cover ? [{ kind: "cover" as const, media: cover }] : []),
    ...(background && draft.appearance.background === "foto"
      ? [{ kind: "background" as const, media: background }]
      : []),
    ...(audio ? [{ kind: "audio" as const, media: audio }] : []),
    ...(qr ? [{ kind: "qr" as const, media: qr }] : []),
    ...gallery.map((media) => ({ kind: "gallery" as const, media })),
  ];
}

/**
 * The wedding this device is moving its draft into, kept until the move ends, so
 * an interrupted publish resumes instead of asking to replace the couple's own
 * wedding (a wedding saved earlier from another device is never replaced silently).
 */
const PENDING_KEY = "lazodoro-publishing";
const pending = {
  get: () => {
    try {
      return localStorage.getItem(PENDING_KEY);
    } catch {
      return null;
    }
  },
  set: (id: string | null) => {
    try {
      if (id) localStorage.setItem(PENDING_KEY, id);
      else localStorage.removeItem(PENDING_KEY);
    } catch {
      // Without storage an interrupted publish asks before replacing; nothing is lost.
    }
  },
};

const subscribe = () => () => {};

export function Publisher() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!mounted) return <Progress title="Preparando…" />;
  return <PublishFlow />;
}

function PublishFlow() {
  const router = useRouter();
  // Read once: this component only renders in the browser.
  const [saveOnly] = useState(() => new URLSearchParams(window.location.search).get("modo") === "guardar");
  const [phase, setPhase] = useState<Phase>(() =>
    useBuilder.getState().draft ? { name: "preparing" } : { name: "empty" },
  );
  const started = useRef(false);

  const run = useCallback(
    async (mode: "new" | "replace") => {
      // A link left blank or half-typed takes the one suggested by the names.
      const typed = useBuilder.getState().draft;
      if (typed && slugProblem(typed.slug)) {
        useBuilder.getState().setSlug(suggestSlug(typed.couple.partner1, typed.couple.partner2));
      }
      const draft = useBuilder.getState().draft;
      if (!draft) return setPhase({ name: "empty" });
      setPhase({ name: "preparing" });

      let result: PrepareResult = await prepareWedding(draft, mode);
      // A publish from this device was interrupted after creating the wedding: resume it.
      if (result.status === "has_wedding" && result.weddingId === pending.get() && mode === "new") {
        result = await prepareWedding(draft, "replace");
      }

      switch (result.status) {
        case "signin":
          router.replace(`/entrar?next=${encodeURIComponent(saveOnly ? SAVE_PATH : "/crear/publicar")}`);
          return;
        case "has_wedding":
          return setPhase({ name: "choose", slug: result.slug, couple: result.couple });
        case "slug_taken":
          return setPhase({ name: "slug", suggestion: result.suggestion });
        case "error":
          return setPhase({ name: "error", message: result.error });
      }

      pending.set(result.weddingId);

      // Photos, QR and song go straight from this device to Storage.
      const files = uploads(draft);
      let failed = 0;
      for (const [index, { kind, media }] of files.entries()) {
        setPhase({ name: "uploading", done: index, total: files.length });
        try {
          const blob = await readLocalMedia(media.id);
          if (!blob) throw new Error("missing");
          const prepared: Prepared = {
            blob,
            ext: EXTENSION[media.mime] ?? "bin",
            mime: media.mime,
            width: media.width,
            height: media.height,
            duration: null,
          };
          await uploadPrepared(result.weddingId, kind, prepared, media.crop ?? null);
        } catch {
          failed++;
        }
      }

      setPhase({ name: "publishing" });
      const finished = await finishPublishing({ publish: !saveOnly });
      if (!finished.ok) return setPhase({ name: "error", message: finished.error });

      // The design now lives in the account: free the device.
      await Promise.all(draftMediaIds(draft).map((id) => removeLocalMedia(id).catch(() => undefined)));
      useBuilder.setState({ draft: null, step: 0 });
      pending.set(null);
      setPhase(
        saveOnly
          ? { name: "saved", failedUploads: failed }
          : { name: "done", slug: finished.slug, share: finished.share, failedUploads: failed },
      );
    },
    [router, saveOnly],
  );

  useEffect(() => {
    if (started.current || phase.name === "empty") return;
    started.current = true;
    void run("new");
  }, [run, phase.name]);

  switch (phase.name) {
    case "preparing":
      return <Progress title="Creando su boda…" />;
    case "uploading":
      return (
        <Progress
          title="Subiendo fotos y música…"
          detail={`${phase.done + 1} de ${phase.total}`}
          value={phase.total ? (phase.done + 1) / phase.total : 1}
        />
      );
    case "publishing":
      return <Progress title={saveOnly ? "Guardando su invitación…" : "Publicando su invitación…"} />;
    case "empty":
      return (
        <Card>
          <h1 className="font-heading text-3xl">No hay un diseño en este dispositivo</h1>
          <p className="text-[var(--site-ink-soft)]">
            Si ya publicaron su invitación, la encuentran en su panel. Si no, empiecen a diseñarla.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild>
              <Link href="/panel">Ir a mi panel</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/crear">Crear mi invitación</Link>
            </Button>
          </div>
        </Card>
      );
    case "choose":
      return <ChooseWedding slug={phase.slug} couple={phase.couple} onReplace={() => run("replace")} />;
    case "slug":
      return <PickSlug suggestion={phase.suggestion} saveOnly={saveOnly} onRetry={() => run("new")} />;
    case "error":
      return (
        <Card>
          <h1 className="font-heading text-3xl">No pudimos terminar</h1>
          <p className="text-[var(--site-ink-soft)]">{phase.message}</p>
          <p className="text-sm text-[var(--site-ink-soft)]">Su diseño sigue guardado en este dispositivo.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => run("new")}>Intentar de nuevo</Button>
            <Button asChild variant="outline">
              <Link href="/crear">Volver al diseño</Link>
            </Button>
          </div>
        </Card>
      );
    case "done":
      return <Published slug={phase.slug} share={phase.share} failedUploads={phase.failedUploads} />;
    case "saved":
      return <Saved failedUploads={phase.failedUploads} />;
  }
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-5 px-4 py-14">
      <div className="grid gap-4 rounded-2xl border border-[var(--site-line)] bg-[var(--site-paper)] p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Progress({ title, detail, value }: { title: string; detail?: string; value?: number }) {
  return (
    <Card>
      <div className="grid justify-items-center gap-4 py-6 text-center">
        <LazoMark className="size-14 animate-pulse" />
        <p className="font-heading text-2xl">{title}</p>
        {detail && <p className="text-sm text-[var(--site-ink-soft)]">{detail}</p>}
        {value !== undefined ? (
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--site-line)]">
            <div className="h-full bg-[var(--site-gold)] transition-all" style={{ width: `${value * 100}%` }} />
          </div>
        ) : (
          <Loader2Icon className="size-5 animate-spin text-[var(--site-gold-deep)]" />
        )}
        <p className="text-xs text-[var(--site-ink-soft)]">No cierren esta página.</p>
      </div>
    </Card>
  );
}

function ChooseWedding({ slug, couple, onReplace }: { slug: string; couple: string; onReplace: () => void }) {
  const router = useRouter();
  const keepCurrent = async () => {
    const draft = useBuilder.getState().draft;
    if (draft) await Promise.all(draftMediaIds(draft).map((id) => removeLocalMedia(id).catch(() => undefined)));
    useBuilder.setState({ draft: null, step: 0 });
    router.push("/panel");
  };
  return (
    <Card>
      <h1 className="font-heading text-3xl">Ya tienen una boda</h1>
      <p className="text-[var(--site-ink-soft)]">
        Esta cuenta ya tiene la invitación de <strong className="text-[var(--site-ink)]">{couple}</strong> en{" "}
        {SITE_URL.replace(/^https?:\/\//, "")}/{slug}. ¿Qué quieren hacer con el diseño de este dispositivo?
      </p>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={onReplace}
          className="grid gap-1 rounded-xl border border-[var(--site-line)] p-4 text-left transition hover:border-[var(--site-gold)] hover:bg-[var(--site-champagne)]/40"
        >
          <span className="font-medium">Reemplazar su invitación con este diseño</span>
          <span className="text-sm text-[var(--site-ink-soft)]">
            Cambian los textos, la plantilla, las fotos y la música. Las confirmaciones y los deseos de sus invitados se
            conservan, y el enlace sigue siendo el mismo.
          </span>
        </button>
        <button
          type="button"
          onClick={keepCurrent}
          className="grid gap-1 rounded-xl border border-[var(--site-line)] p-4 text-left transition hover:border-[var(--site-gold)] hover:bg-[var(--site-champagne)]/40"
        >
          <span className="font-medium">Mantener mi boda actual</span>
          <span className="text-sm text-[var(--site-ink-soft)]">
            Se descarta el diseño de este dispositivo y van a su panel.
          </span>
        </button>
      </div>
    </Card>
  );
}

function PickSlug({
  suggestion,
  saveOnly,
  onRetry,
}: {
  suggestion: string | null;
  saveOnly: boolean;
  onRetry: () => void;
}) {
  const setSlug = useBuilder((s) => s.setSlug);
  const [value, setValue] = useState(suggestion ?? useBuilder.getState().draft?.slug ?? "");
  const problem = slugProblem(value);
  return (
    <Card>
      <h1 className="font-heading text-3xl">Ese enlace ya lo usa otra pareja</h1>
      <p className="text-[var(--site-ink-soft)]">Elijan otro; les proponemos uno libre.</p>
      <div className="flex items-center overflow-hidden rounded-md border bg-muted/40">
        <span className="shrink-0 pl-3 text-sm text-muted-foreground">{SITE_URL.replace(/^https?:\/\//, "")}/</span>
        <Input
          aria-label="Enlace de la invitación"
          value={value}
          onChange={(e) => setValue(normalizeSlugInput(e.target.value))}
          className="border-0 bg-transparent pl-0.5 shadow-none focus-visible:ring-0"
        />
      </div>
      <Button
        disabled={problem !== null}
        onClick={() => {
          setSlug(value);
          onRetry();
        }}
      >
        {saveOnly ? "Usar este enlace y guardar" : "Usar este enlace y publicar"}
      </Button>
    </Card>
  );
}

function Saved({ failedUploads }: { failedUploads: number }) {
  return (
    <Card>
      <div className="grid justify-items-center gap-3 text-center">
        <CloudCheckIcon className="size-12 text-success" />
        <h1 className="font-heading text-3xl">Su invitación está guardada en su cuenta</h1>
        <p className="text-[var(--site-ink-soft)]">
          Todavía no está publicada: nadie la ve. Síganla editando desde su panel, en este o en cualquier otro
          dispositivo, y publíquenla en <strong className="text-[var(--site-ink)]">Ajustes</strong> cuando esté lista.
        </p>
        {failedUploads > 0 && (
          <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
            {failedUploads} archivo(s) no se pudieron subir. Pueden añadirlos desde su panel.
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Button asChild size="lg" className="h-12">
          <Link href="/panel">
            <LayoutDashboardIcon /> Seguir en mi panel
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/panel/vista-previa">
            <EyeIcon /> Ver cómo va quedando
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function Published({ slug, share, failedUploads }: { slug: string; share: ShareDetails; failedUploads: number }) {
  const [sharing, setSharing] = useState(true);
  const url = `${SITE_URL}/${slug}`;
  return (
    <Card>
      <div className="grid justify-items-center gap-3 text-center">
        <CheckCircle2Icon className="size-12 text-success" />
        <h1 className="font-heading text-3xl">¡Su invitación está publicada!</h1>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="font-medium break-all text-[var(--site-gold-deep)] underline"
        >
          {url.replace(/^https?:\/\//, "")}
        </a>
        {failedUploads > 0 && (
          <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
            {failedUploads} archivo(s) no se pudieron subir. Pueden añadirlos desde su panel.
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Button size="lg" className="h-12" onClick={() => setSharing(true)}>
          <Share2Icon /> Compartir con sus invitados
        </Button>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline">
            <a href={url} target="_blank" rel="noopener">
              <ExternalLinkIcon /> Ver mi invitación
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/panel">
              <LayoutDashboardIcon /> Ir a mi panel
            </Link>
          </Button>
        </div>
      </div>
      <ShareInvitationDialog slug={slug} details={share} open={sharing} onOpenChange={setSharing} justPublished />
      <p className="text-center text-xs text-[var(--site-ink-soft)]">
        Lazo de Oro es gratis.{" "}
        <Link href="/donar" className="underline underline-offset-4">
          Si les gustó, pueden apoyarnos ♡
        </Link>
      </p>
    </Card>
  );
}
