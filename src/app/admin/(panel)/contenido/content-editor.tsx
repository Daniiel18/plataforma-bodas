"use client";

import "@/components/invitation/invitation.css";

import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { EnvelopePreview, SectionPreview } from "@/components/invitation/section-preview";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { buildSectionView, type InvitationData, type ViewContext } from "@/lib/section-view";
import {
  bilingual,
  DEFAULT_TEXT,
  parseContent,
  SECTION_LABELS,
  type SectionContent,
  type SectionType,
} from "@/lib/sections";
import { cn } from "@/lib/utils";

import type { CurrentMedia } from "../single-media-field";
import { moveSection, saveTranslation, setSectionVisible } from "./actions";
import { SectionForm } from "./section-forms";

export type TranslationRow = { path: string; es: string; en: string | null; manual: boolean };

export type EditorSection = {
  type: SectionType;
  visible: boolean;
  content: SectionContent<SectionType>;
  translations: TranslationRow[];
};

type Props = {
  weddingId: string;
  sections: EditorSection[];
  cover: CurrentMedia;
  hasEventDate: boolean;
  /** The invitation as saved, for the template, fonts and shared data of the previews. */
  invitation: InvitationData;
  ctx: ViewContext;
};

const FIXED: SectionType[] = ["intro", "music"];
/**
 * Sections managed on their own page (photos, Zelle, song): here they are only
 * ordered and hidden, without a preview.
 */
const MANAGED_ELSEWHERE: SectionType[] = ["gallery", "gifts", "music"];

/** Why a section has no preview yet. */
const EMPTY_HINT: Partial<Record<SectionType, string>> = {
  parents: "Escribe al menos un nombre para ver esta sección.",
  celebration: "Define la fecha de la boda en Ajustes para ver esta sección.",
  location: "Escribe el lugar o la dirección para ver esta sección.",
  dress_code: "Escribe la descripción para ver esta sección.",
  program: "Agrega al menos un momento del día para ver esta sección.",
};

export function ContentEditor({ weddingId, sections, cover, hasEventDate, invitation, ctx }: Props) {
  const orderable = sections.filter((s) => !FIXED.includes(s.type));
  const ordered = [
    ...sections.filter((s) => s.type === "intro"),
    ...orderable,
    ...sections.filter((s) => s.type === "music"),
  ];

  return (
    <div className="grid gap-3">
      {ordered.map((section) => {
        const index = orderable.findIndex((s) => s.type === section.type);
        return (
          <SectionCard
            key={section.type}
            section={section}
            invitation={invitation}
            ctx={ctx}
            weddingId={weddingId}
            cover={cover}
            canMoveUp={index > 0}
            canMoveDown={index >= 0 && index < orderable.length - 1}
            fixed={FIXED.includes(section.type)}
            warning={
              section.type === "celebration" && !hasEventDate ? (
                <>
                  Sin fecha de boda esta sección no se muestra.{" "}
                  <Link href="/admin/ajustes" className="underline">
                    Definir en Ajustes
                  </Link>
                </>
              ) : null
            }
          />
        );
      })}
    </div>
  );
}

function SectionCard({
  section,
  invitation,
  ctx,
  weddingId,
  cover,
  canMoveUp,
  canMoveDown,
  fixed,
  warning,
}: {
  section: EditorSection;
  invitation: InvitationData;
  ctx: ViewContext;
  weddingId: string;
  cover: CurrentMedia;
  canMoveUp: boolean;
  canMoveDown: boolean;
  fixed: boolean;
  warning: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(section.visible);
  const [draft, setDraft] = useState<unknown>(section.content);
  const [pending, startTransition] = useTransition();
  const editable = !MANAGED_ELSEWHERE.includes(section.type);

  const toggleVisible = (value: boolean) => {
    setVisible(value);
    startTransition(async () => {
      const result = await setSectionVisible(section.type, value);
      if (result.ok) toast.success(result.message);
      else {
        setVisible(!value);
        toast.error(result.error);
      }
    });
  };

  const move = (direction: -1 | 1) =>
    startTransition(async () => {
      const result = await moveSection(section.type, direction);
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });

  const preview = editable && <LivePreview type={section.type} draft={draft} invitation={invitation} ctx={ctx} />;

  return (
    <Card className={cn("gap-0 overflow-hidden py-0", !visible && "opacity-70")}>
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-left font-medium"
        >
          <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
          {SECTION_LABELS[section.type]}
          {!visible && <Badge variant="secondary">Oculta</Badge>}
        </button>
        {!fixed && (
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              disabled={!canMoveUp || pending}
              onClick={() => move(-1)}
              aria-label="Subir"
            >
              <ArrowUpIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canMoveDown || pending}
              onClick={() => move(1)}
              aria-label="Bajar"
            >
              <ArrowDownIcon />
            </Button>
          </div>
        )}
        <Switch
          checked={visible}
          disabled={pending}
          onCheckedChange={toggleVisible}
          aria-label={`Mostrar ${SECTION_LABELS[section.type]}`}
        />
      </div>
      {warning && <p className="border-t bg-amber-50 px-4 py-2 text-sm text-amber-900">{warning}</p>}

      {!open && editable && (
        // Thumbnail of the section with the chosen template; tapping it opens the editor.
        <div className="relative h-44 overflow-hidden border-t bg-muted/30">
          <div
            className="pointer-events-none absolute top-0 left-1/2 w-[380px] origin-top -translate-x-1/2 scale-[0.6]"
            inert
          >
            {preview}
          </div>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 cursor-pointer"
            aria-label={`Editar ${SECTION_LABELS[section.type]}`}
          />
        </div>
      )}

      {open && (
        <CardContent className={cn("grid gap-6 border-t py-5", editable && "lg:grid-cols-[minmax(0,1fr)_380px]")}>
          <div className="grid content-start gap-4">
            {editable ? (
              <SectionForm
                type={section.type}
                content={section.content}
                weddingId={weddingId}
                cover={cover}
                onDraft={setDraft}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{MANAGED_NOTE[section.type]}</p>
            )}
            {section.translations.length > 0 && <TranslationReview type={section.type} rows={section.translations} />}
          </div>
          {editable && (
            <div className="grid content-start gap-2 lg:sticky lg:top-6">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Así se verá</p>
              {preview}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

const MANAGED_NOTE: Partial<Record<SectionType, string>> = {
  gallery: "Las fotos y el estilo del carrusel se eligen en Galería.",
  gifts: "El QR y los datos de Zelle se agregan en Regalos.",
  music: "Suena de fondo cuando los invitados abren el sobre. La canción se sube en Música.",
};

/** The section with the couple's template, following the form while they type. */
function LivePreview({
  type,
  draft,
  invitation,
  ctx,
}: {
  type: SectionType;
  draft: unknown;
  invitation: InvitationData;
  ctx: ViewContext;
}) {
  const view = useMemo(() => buildSectionView(type, draft, {}, ctx), [type, draft, ctx]);
  const frame = "mx-auto w-full max-w-[380px] rounded-xl border";

  if (type === "intro") {
    const c = parseContent("intro", draft);
    return (
      <SectionPreview data={invitation} className={frame}>
        <EnvelopePreview
          data={invitation}
          title={bilingual(c.title, "title", {}, DEFAULT_TEXT.intro.title)!}
          subtitle={bilingual(c.subtitle, "subtitle", {})}
          button={bilingual(c.button, "button", {}, DEFAULT_TEXT.intro.button)!}
        />
      </SectionPreview>
    );
  }

  if (!view) {
    return (
      <div
        className={cn(
          frame,
          "grid min-h-32 place-items-center border-dashed p-6 text-center text-sm text-muted-foreground",
        )}
      >
        {EMPTY_HINT[type] ?? "Completa esta sección para verla."}
      </div>
    );
  }

  return <SectionPreview data={invitation} view={view} className={frame} />;
}

function TranslationReview({ type, rows }: { type: SectionType; rows: TranslationRow[] }) {
  const [open, setOpen] = useState(false);
  const pending = rows.filter((r) => !r.en).length;

  return (
    <div className="mt-6 rounded-lg border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
      >
        <LanguagesIcon className="size-4" />
        Ver y corregir el inglés ({rows.length} {rows.length === 1 ? "texto" : "textos"})
        {pending > 0 && <Badge variant="destructive">{pending} sin traducir</Badge>}
        <ChevronDownIcon className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="grid gap-3 border-t p-3">
          {rows.map((row) => (
            <TranslationField key={row.path} type={type} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TranslationField({ type, row }: { type: SectionType; row: TranslationRow }) {
  const router = useRouter();
  const [value, setValue] = useState(row.en ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = value.trim() !== (row.en ?? "");

  return (
    <li className="grid gap-1.5">
      <p className="text-xs text-muted-foreground">
        ES: <span className="text-foreground">{row.es}</span>
        {row.manual && (
          <Badge variant="outline" className="ml-2">
            corregido
          </Badge>
        )}
      </p>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Traducción pendiente" />
        <Button
          size="sm"
          variant="secondary"
          disabled={!dirty || !value.trim() || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveTranslation(type, row.path, value);
              if (result.ok) toast.success(result.message);
              else toast.error(result.error);
              router.refresh();
            })
          }
        >
          Guardar
        </Button>
      </div>
    </li>
  );
}
