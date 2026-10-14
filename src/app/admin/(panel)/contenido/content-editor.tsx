"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, LanguagesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SECTION_LABELS, type SectionContent, type SectionType } from "@/lib/sections";
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
};

const FIXED: SectionType[] = ["intro", "music"];
const EXTERNAL: Partial<Record<SectionType, { href: string; label: string }>> = {
  gallery: { href: "/admin/galeria", label: "Fotos y estilo en Galería" },
  gifts: { href: "/admin/regalos", label: "QR y datos en Regalos" },
  music: { href: "/admin/musica", label: "Canción en Música" },
};

export function ContentEditor({ weddingId, sections, cover, hasEventDate }: Props) {
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
          >
            {EXTERNAL[section.type] && (
              <Button variant="outline" size="sm" asChild className="mb-4">
                <Link href={EXTERNAL[section.type]!.href}>{EXTERNAL[section.type]!.label} →</Link>
              </Button>
            )}
            {section.type !== "music" && section.type !== "gallery" && section.type !== "gifts" && (
              <SectionForm type={section.type} content={section.content} weddingId={weddingId} cover={cover} />
            )}
            {section.translations.length > 0 && <TranslationReview type={section.type} rows={section.translations} />}
          </SectionCard>
        );
      })}
    </div>
  );
}

function SectionCard({
  section,
  canMoveUp,
  canMoveDown,
  fixed,
  warning,
  children,
}: {
  section: EditorSection;
  canMoveUp: boolean;
  canMoveDown: boolean;
  fixed: boolean;
  warning: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(section.visible);
  const [pending, startTransition] = useTransition();

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

  return (
    <Card className={cn("gap-0 py-0", !visible && "opacity-70")}>
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
      {open && <CardContent className="border-t py-5">{children}</CardContent>}
    </Card>
  );
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
