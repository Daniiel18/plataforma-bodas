import { ClockIcon, ShirtIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { InvitationData, SectionView } from "@/lib/invitation";
import { FRAME } from "@/lib/photo-crop";
import { getTemplate, type OrnamentSet } from "@/lib/templates";

import { AddToCalendar } from "./add-to-calendar";
import { Countdown } from "./countdown";
import { Flourish, Ornament } from "./decorations";
import { FramedPhoto } from "./framed-photo";
import { DirectionsButton } from "./directions-button";
import { eventDateParts, formatClock } from "./format";
import { Gallery3D } from "./gallery-3d";
import { GiftBox } from "./gift-box";
import { T, TB } from "./lang";
import { MonthCalendar } from "./month-calendar";
import { RsvpForm } from "./rsvp-form";

type Of<K extends SectionView["type"]> = Extract<SectionView, { type: K }>;

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`inv-reveal relative px-5 py-10 ${className}`}>{children}</section>;
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 grid justify-items-center gap-2 text-center">
      <h2 className="inv-heading">{children}</h2>
      <Flourish className="w-28 text-[var(--inv-gold)]" />
    </div>
  );
}

export function HeroSection({ section, data }: { section: Of<"hero">; data: InvitationData }) {
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  const ornaments = getTemplate(data.template).ornaments;
  return (
    <Section className="overflow-hidden pt-16 text-center">
      <Ornament
        set={ornaments}
        variant="secondary"
        className="pointer-events-none absolute -top-4 -left-6 w-24 rotate-[-20deg] opacity-70"
      />
      <p className="inv-heading text-xs text-[var(--inv-ink-soft)]">
        <TB text={section.kicker} />
      </p>
      <h1 className="inv-script mt-4 flex items-center justify-center gap-4 text-5xl leading-none text-[var(--inv-accent)] sm:text-6xl">
        <span className="inv-names">{first(data.couple.partner1)}</span>
        <span className="inv-names text-3xl">&amp;</span>
        <span className="inv-names">{first(data.couple.partner2)}</span>
      </h1>
      {section.cover && (
        <div className="inv-polaroid relative mx-auto mt-10 w-[78%] max-w-xs rotate-[-2deg] bg-[var(--inv-paper)] p-3 pb-12 shadow-[var(--inv-shadow)]">
          <span
            className="inv-polaroid-tape absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[3deg]"
            aria-hidden
          />
          <div className="inv-polaroid-photo relative aspect-[4/5] overflow-hidden">
            <FramedPhoto
              photo={section.cover}
              frame={FRAME.cover}
              alt={`${data.couple.partner1} & ${data.couple.partner2}`}
              width={320}
              priority
            />
          </div>
          <Ornament set={ornaments} className="pointer-events-none absolute -bottom-10 -left-12 w-24 rotate-[-12deg]" />
          <span
            className="inv-polaroid-seal inv-wax absolute -right-4 -bottom-4 grid size-14 place-items-center rounded-full shadow-md"
            aria-hidden
          >
            ♡
          </span>
        </div>
      )}
      {!section.cover && <Ornament set={ornaments} className="mx-auto mt-8 w-20 opacity-90" />}
    </Section>
  );
}

export function ParentsSection({ section }: { section: Of<"parents"> }) {
  return (
    <Section>
      <div className="inv-card px-5 py-8 text-center">
        <Heading>
          <TB text={section.title} />
        </Heading>
        <div
          className={`grid gap-6 ${section.families.length > 1 ? "grid-cols-2 divide-x divide-[var(--inv-line)]" : ""}`}
        >
          {section.families.map((family, i) => (
            <div key={i} className="grid content-start gap-1 px-2">
              {family.title && (
                <p className="text-sm text-[var(--inv-ink-soft)]">
                  <TB text={family.title} />
                </p>
              )}
              {family.names.map((name) => (
                <p key={name} className="text-lg leading-snug font-medium">
                  {name}
                </p>
              ))}
            </div>
          ))}
        </div>
        {section.intro && (
          <p className="mt-8 text-sm leading-relaxed tracking-[0.12em] whitespace-pre-line uppercase">
            <TB text={section.intro} />
          </p>
        )}
      </div>
    </Section>
  );
}

export function CelebrationSection({ section, data }: { section: Of<"celebration">; data: InvitationData }) {
  if (!data.event) return null;
  const d = eventDateParts(data.event.startsAt, data.event.timeZone);
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  const location = data.location ? [data.location.venue, data.location.address].filter(Boolean).join(", ") : "";

  return (
    <Section>
      <div className="inv-card overflow-hidden px-5 py-8 text-center">
        <Ornament
          set={getTemplate(data.template).ornaments}
          className="pointer-events-none absolute -right-6 bottom-24 w-20 rotate-[14deg] opacity-80"
        />
        <Heading>
          <TB text={section.title} />
        </Heading>
        {section.message && (
          <p className="mb-4 whitespace-pre-line">
            <TB text={section.message} />
          </p>
        )}
        <p className="text-3xl font-medium">{d.time}</p>
        <div className="my-4 flex items-center justify-center gap-4 text-sm tracking-[0.2em] uppercase">
          <span className="flex-1 text-right">
            <TB text={d.weekday} />
          </span>
          <span className="border-x border-[var(--inv-ink)]/40 px-4 text-4xl font-medium tracking-normal">{d.day}</span>
          <span className="flex-1 text-left">
            <TB text={d.month} />
          </span>
        </div>
        <p className="text-xl">{d.year}</p>

        <div className="mt-8 grid gap-3">
          <p className="text-sm tracking-[0.15em] text-[var(--inv-ink-soft)] uppercase">
            <T es="Cuenta regresiva" en="Countdown" />
          </p>
          <Countdown target={data.event.startsAt} />
        </div>

        <div className="mt-8">
          <MonthCalendar startsAt={data.event.startsAt} timeZone={data.event.timeZone} />
        </div>

        <div className="mt-6">
          <AddToCalendar
            slug={data.slug}
            startsAt={data.event.startsAt}
            location={location}
            title={{
              es: `Boda de ${first(data.couple.partner1)} & ${first(data.couple.partner2)}`,
              en: `${first(data.couple.partner1)} & ${first(data.couple.partner2)}'s wedding`,
            }}
          />
        </div>
      </div>
    </Section>
  );
}

export function GallerySection({ section }: { section: Of<"gallery"> }) {
  return (
    <Section className="px-0">
      <div className="px-5">
        <Heading>
          <TB text={section.title} />
        </Heading>
      </div>
      <Gallery3D photos={section.photos} style={section.style} autoplay={section.autoplay} />
    </Section>
  );
}

export function LocationSection({ section }: { section: Of<"location"> }) {
  const query = [section.venue, section.address].filter(Boolean).join(", ");
  // The exact spot from the map, when set, is more precise than the address.
  const mapQuery = section.coords ? `${section.coords.lat},${section.coords.lng}` : query;
  return (
    <Section className="text-center">
      <Heading>
        <TB text={section.title} />
      </Heading>
      {section.venue && <p className="text-2xl font-medium">{section.venue}</p>}
      {section.address && <p className="mt-1 text-[var(--inv-ink-soft)]">{section.address}</p>}
      {section.note && (
        <p className="mt-3 text-sm whitespace-pre-line">
          <TB text={section.note} />
        </p>
      )}
      <div className="mt-6 overflow-hidden rounded-2xl shadow-[var(--inv-shadow)] ring-1 ring-[var(--inv-line)]">
        <iframe
          title={query}
          src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
          className="h-64 w-full grayscale-[35%] sepia-[15%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="mt-6">
        <DirectionsButton query={query} coords={section.coords} venue={section.venue} />
      </div>
    </Section>
  );
}

export function DressCodeSection({ section, ornaments }: { section: Of<"dress_code">; ornaments: OrnamentSet }) {
  return (
    <Section className="text-center">
      <ShirtIcon className="mx-auto mb-3 size-6 text-[var(--inv-gold)]" aria-hidden />
      <Heading>
        <TB text={section.title} />
      </Heading>
      <p className="text-lg tracking-wide whitespace-pre-line">
        <TB text={section.description} />
      </p>
      <Ornament
        set={ornaments}
        variant="secondary"
        className="pointer-events-none absolute top-6 -right-4 w-16 rotate-[18deg] opacity-60"
      />
    </Section>
  );
}

export function ProgramSection({ section }: { section: Of<"program"> }) {
  return (
    <Section>
      <div className="inv-card px-6 py-8">
        <Heading>
          <TB text={section.title} />
        </Heading>
        <ol className="relative grid gap-5 before:absolute before:top-2 before:bottom-2 before:left-[5.6rem] before:w-px before:bg-[var(--inv-line)]">
          {section.items.map((item, i) => (
            <li key={i} className="grid grid-cols-[5rem_1fr] items-center gap-5">
              <span className="flex items-center justify-end gap-1.5 text-sm font-medium tabular-nums">
                <ClockIcon className="size-3.5 text-[var(--inv-ink-soft)]" aria-hidden />
                {formatClock(item.time)}
              </span>
              <span className="relative pl-1 text-lg before:absolute before:top-1/2 before:-left-[1.05rem] before:size-2.5 before:-translate-y-1/2 before:rounded-full before:bg-[var(--inv-accent)]">
                <TB text={item.title} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

export function RsvpSection({ section, slug, preview }: { section: Of<"rsvp">; slug: string; preview?: boolean }) {
  return (
    <Section className="text-center">
      <div id="confirmar" className="scroll-mt-6">
        <Heading>
          <TB text={section.title} />
        </Heading>
        <p className="mb-6 whitespace-pre-line text-[var(--inv-ink-soft)]">
          <TB text={section.message} />
        </p>
        <RsvpForm
          slug={slug}
          maxCompanions={section.maxCompanions}
          deadline={section.deadline}
          deadlineLabel={section.deadlineLabel}
          closed={section.closed}
          preview={preview}
        />
      </div>
    </Section>
  );
}

export function GiftsSection({ section }: { section: Of<"gifts"> }) {
  return (
    <Section className="text-center">
      <Heading>
        <TB text={section.title} />
      </Heading>
      <GiftBox methods={section.methods} />
      <p className="mx-auto mt-8 max-w-xs whitespace-pre-line text-[var(--inv-ink-soft)] italic">
        <TB text={section.message} />
      </p>
    </Section>
  );
}
