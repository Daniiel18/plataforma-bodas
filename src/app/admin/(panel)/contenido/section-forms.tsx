"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TEXT, type SectionContent, type SectionType } from "@/lib/sections";

import { SingleMediaField, type CurrentMedia } from "../single-media-field";
import { saveSection } from "./actions";

type FormProps = {
  type: SectionType;
  content: SectionContent<SectionType>;
  weddingId: string;
  cover: CurrentMedia;
};

export function SectionForm({ type, content, weddingId, cover }: FormProps) {
  switch (type) {
    case "intro":
      return <IntroForm initial={content as SectionContent<"intro">} />;
    case "hero":
      return <HeroForm initial={content as SectionContent<"hero">} weddingId={weddingId} cover={cover} />;
    case "parents":
      return <ParentsForm initial={content as SectionContent<"parents">} />;
    case "celebration":
      return <CelebrationForm initial={content as SectionContent<"celebration">} />;
    case "location":
      return <LocationForm initial={content as SectionContent<"location">} />;
    case "dress_code":
      return <DressCodeForm initial={content as SectionContent<"dress_code">} />;
    case "program":
      return <ProgramForm initial={content as SectionContent<"program">} />;
    case "rsvp":
      return <RsvpForm initial={content as SectionContent<"rsvp">} />;
    default:
      return null;
  }
}

/** Formulario común: guarda la sección, traduce y refresca la vista. */
function useSectionSave<T extends SectionType>(type: T) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const save = (data: SectionContent<T>) =>
    startTransition(async () => {
      const result = await saveSection(type, data);
      if (result.ok) {
        if (result.pending) toast.warning(result.message);
        else toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  return { pending, save };
}

function FormShell({ onSubmit, pending, children }: { onSubmit: () => void; pending: boolean; children: ReactNode }) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Guardando y traduciendo…" : "Guardar"}
      </Button>
    </form>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  max,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  max: number;
  multiline?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={max}
          rows={3}
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={max}
        />
      )}
    </div>
  );
}

function useFields<T extends object>(initial: T) {
  const [values, setValues] = useState(initial);
  const set =
    <K extends keyof T>(key: K) =>
    (value: T[K]) =>
      setValues((v) => ({ ...v, [key]: value }));
  return { values, setValues, set };
}

function IntroForm({ initial }: { initial: SectionContent<"intro"> }) {
  const { values, set } = useFields(initial);
  const { pending, save } = useSectionSave("intro");
  return (
    <FormShell onSubmit={() => save(values)} pending={pending}>
      <p className="text-sm text-muted-foreground">
        Es lo primero que ven los invitados: un sobre con un botón para abrirlo.
      </p>
      <TextField
        id="intro-title"
        label="Frase principal"
        value={values.title}
        onChange={set("title")}
        placeholder={DEFAULT_TEXT.intro.title.es}
        max={120}
      />
      <TextField
        id="intro-subtitle"
        label="Frase secundaria (opcional)"
        value={values.subtitle}
        onChange={set("subtitle")}
        max={200}
      />
      <TextField
        id="intro-button"
        label="Texto del botón"
        value={values.button}
        onChange={set("button")}
        placeholder={DEFAULT_TEXT.intro.button.es}
        max={30}
      />
    </FormShell>
  );
}

function HeroForm({
  initial,
  weddingId,
  cover,
}: {
  initial: SectionContent<"hero">;
  weddingId: string;
  cover: CurrentMedia;
}) {
  const { values, set } = useFields(initial);
  const { pending, save } = useSectionSave("hero");
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
      <FormShell onSubmit={() => save(values)} pending={pending}>
        <TextField
          id="hero-kicker"
          label="Texto sobre los nombres"
          value={values.kicker}
          onChange={set("kicker")}
          placeholder={DEFAULT_TEXT.hero.kicker.es}
          max={60}
        />
        <p className="text-sm text-muted-foreground">Los nombres se cambian en Ajustes.</p>
      </FormShell>
      <div className="grid gap-2">
        <Label>Foto de portada (opcional)</Label>
        <SingleMediaField
          weddingId={weddingId}
          kind="cover"
          current={cover}
          emptyLabel="Subir foto de portada"
          hint="Se muestra como una foto polaroid."
        />
      </div>
    </div>
  );
}

function ParentsForm({ initial }: { initial: SectionContent<"parents"> }) {
  const { values, setValues, set } = useFields({
    ...initial,
    families: initial.families.length ? initial.families : [{ title: "Sr. y Sra.", names: ["", ""] }],
  });
  const { pending, save } = useSectionSave("parents");

  const updateFamily = (index: number, patch: Partial<SectionContent<"parents">["families"][number]>) =>
    setValues((v) => ({ ...v, families: v.families.map((f, i) => (i === index ? { ...f, ...patch } : f)) }));

  return (
    <FormShell
      pending={pending}
      onSubmit={() =>
        save({
          ...values,
          families: values.families
            .map((f) => ({ title: f.title, names: f.names.map((n) => n.trim()).filter(Boolean) }))
            .filter((f) => f.names.length > 0),
        })
      }
    >
      <TextField
        id="parents-title"
        label="Título"
        value={values.title}
        onChange={set("title")}
        placeholder={DEFAULT_TEXT.parents.title.es}
        max={120}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {values.families.map((family, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label>Familia {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar familia"
                onClick={() => setValues((v) => ({ ...v, families: v.families.filter((_, i) => i !== index) }))}
              >
                <Trash2Icon />
              </Button>
            </div>
            <Input
              value={family.title}
              onChange={(e) => updateFamily(index, { title: e.target.value })}
              placeholder="Sr. y Sra."
              maxLength={40}
            />
            {[0, 1, 2].map((n) => (
              <Input
                key={n}
                value={family.names[n] ?? ""}
                onChange={(e) => {
                  const names = [...family.names];
                  names[n] = e.target.value;
                  updateFamily(index, { names });
                }}
                placeholder={n < 2 ? `Nombre ${n + 1}` : "Nombre 3 (opcional)"}
                maxLength={80}
              />
            ))}
          </div>
        ))}
      </div>
      {values.families.length < 4 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() =>
            setValues((v) => ({ ...v, families: [...v.families, { title: "Sr. y Sra.", names: ["", ""] }] }))
          }
        >
          <PlusIcon /> Agregar familia
        </Button>
      )}
      <TextField
        id="parents-intro"
        label="Frase de invitación (opcional)"
        value={values.intro}
        onChange={set("intro")}
        placeholder="Tenemos la alegría de invitarles a la boda de nuestros hijos"
        max={300}
        multiline
      />
    </FormShell>
  );
}

function CelebrationForm({ initial }: { initial: SectionContent<"celebration"> }) {
  const { values, set } = useFields(initial);
  const { pending, save } = useSectionSave("celebration");
  return (
    <FormShell onSubmit={() => save(values)} pending={pending}>
      <p className="text-sm text-muted-foreground">
        Incluye la hora, la fecha, la cuenta regresiva, el calendario y &quot;Añadir al calendario&quot;. La fecha se
        toma de Ajustes.
      </p>
      <TextField
        id="celebration-title"
        label="Título"
        value={values.title}
        onChange={set("title")}
        placeholder={DEFAULT_TEXT.celebration.title.es}
        max={120}
      />
      <TextField
        id="celebration-message"
        label="Mensaje (opcional)"
        value={values.message}
        onChange={set("message")}
        placeholder="La celebración se llevará a cabo a las:"
        max={300}
        multiline
      />
    </FormShell>
  );
}

function LocationForm({ initial }: { initial: SectionContent<"location"> }) {
  const { values, set } = useFields(initial);
  const { pending, save } = useSectionSave("location");
  return (
    <FormShell onSubmit={() => save(values)} pending={pending}>
      <TextField
        id="location-title"
        label="Título"
        value={values.title}
        onChange={set("title")}
        placeholder={DEFAULT_TEXT.location.title.es}
        max={120}
      />
      <TextField
        id="location-venue"
        label="Nombre del lugar"
        value={values.venue}
        onChange={set("venue")}
        placeholder="Salón Los Olivos"
        max={120}
      />
      <TextField
        id="location-address"
        label="Dirección (para el mapa y Cómo llegar)"
        value={values.address}
        onChange={set("address")}
        placeholder="123 Main St, Miami, FL"
        max={200}
      />
      <TextField
        id="location-note"
        label="Nota (opcional)"
        value={values.note}
        onChange={set("note")}
        placeholder="Estacionamiento gratuito"
        max={200}
      />
    </FormShell>
  );
}

function DressCodeForm({ initial }: { initial: SectionContent<"dress_code"> }) {
  const { values, set } = useFields(initial);
  const { pending, save } = useSectionSave("dress_code");
  return (
    <FormShell onSubmit={() => save(values)} pending={pending}>
      <TextField
        id="dress-title"
        label="Título"
        value={values.title}
        onChange={set("title")}
        placeholder={DEFAULT_TEXT.dress_code.title.es}
        max={120}
      />
      <TextField
        id="dress-description"
        label="Descripción"
        value={values.description}
        onChange={set("description")}
        placeholder="Formal"
        max={400}
        multiline
      />
    </FormShell>
  );
}

function ProgramForm({ initial }: { initial: SectionContent<"program"> }) {
  const { values, setValues, set } = useFields(initial);
  const { pending, save } = useSectionSave("program");
  const items = values.items;

  const update = (index: number, patch: Partial<(typeof items)[number]>) =>
    setValues((v) => ({ ...v, items: v.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  const move = (index: number, delta: number) =>
    setValues((v) => {
      const next = [...v.items];
      const target = index + delta;
      if (target < 0 || target >= next.length) return v;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...v, items: next };
    });

  return (
    <FormShell
      pending={pending}
      onSubmit={() => save({ ...values, items: values.items.filter((i) => i.title.trim() && i.time) })}
    >
      <TextField
        id="program-title"
        label="Título"
        value={values.title}
        onChange={set("title")}
        placeholder={DEFAULT_TEXT.program.title.es}
        max={120}
      />
      <Separator />
      <div className="grid gap-2">
        <Label>Actividades</Label>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Agrega la primera actividad (por ejemplo: 3:00 PM · Ceremonia).
          </p>
        )}
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="time"
              value={item.time}
              onChange={(e) => update(index, { time: e.target.value })}
              className="w-32"
              aria-label="Hora"
              required
            />
            <Input
              value={item.title}
              onChange={(e) => update(index, { title: e.target.value })}
              placeholder="Ceremonia"
              maxLength={80}
              aria-label="Actividad"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label="Subir"
            >
              <ArrowUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              aria-label="Bajar"
            >
              <ArrowDownIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar actividad"
              onClick={() => setValues((v) => ({ ...v, items: v.items.filter((_, i) => i !== index) }))}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        {items.length < 15 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-self-start"
            onClick={() => setValues((v) => ({ ...v, items: [...v.items, { time: "", title: "" }] }))}
          >
            <PlusIcon /> Agregar actividad
          </Button>
        )}
      </div>
    </FormShell>
  );
}

function RsvpForm({ initial }: { initial: SectionContent<"rsvp"> }) {
  const { values, set } = useFields(initial);
  const { pending, save } = useSectionSave("rsvp");
  return (
    <FormShell onSubmit={() => save(values)} pending={pending}>
      <p className="text-sm text-muted-foreground">
        Los invitados escriben su nombre, si asisten y los nombres de sus acompañantes. La fecha límite y el máximo de
        acompañantes se cambian en Ajustes.
      </p>
      <TextField
        id="rsvp-title"
        label="Título"
        value={values.title}
        onChange={set("title")}
        placeholder={DEFAULT_TEXT.rsvp.title.es}
        max={120}
      />
      <TextField
        id="rsvp-message"
        label="Mensaje"
        value={values.message}
        onChange={set("message")}
        placeholder={DEFAULT_TEXT.rsvp.message.es}
        max={300}
        multiline
      />
      <TextField
        id="rsvp-closed"
        label="Mensaje cuando cierren las confirmaciones"
        value={values.closed_message}
        onChange={set("closed_message")}
        placeholder={DEFAULT_TEXT.rsvp.closed.es}
        max={300}
        multiline
      />
    </FormShell>
  );
}
