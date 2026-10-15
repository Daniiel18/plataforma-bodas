import "./invitation.css";

import type { CSSProperties } from "react";

import { veilStrength } from "@/lib/backgrounds";
import type { InvitationData, SectionView } from "@/lib/invitation";
import { getTemplate, themeAttributes, themeStyle } from "@/lib/templates";

import { Envelope } from "./envelope";
import { invitationFonts } from "./fonts";
import { eventDateParts } from "./format";
import { LangScript } from "./lang";
import { LanguageToggle } from "./language-toggle";
import { MusicProvider } from "./music";
import {
  CelebrationSection,
  DressCodeSection,
  GallerySection,
  GiftsSection,
  HeroSection,
  LocationSection,
  ParentsSection,
  ProgramSection,
  RsvpSection,
} from "./invitation-sections";

function renderSection(section: SectionView, data: InvitationData, preview: boolean) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} data={data} />;
    case "parents":
      return <ParentsSection section={section} />;
    case "celebration":
      return <CelebrationSection section={section} data={data} />;
    case "gallery":
      return <GallerySection section={section} />;
    case "location":
      return <LocationSection section={section} />;
    case "dress_code":
      return <DressCodeSection section={section} ornaments={getTemplate(data.template).ornaments} />;
    case "program":
      return <ProgramSection section={section} />;
    case "rsvp":
      return <RsvpSection section={section} slug={data.slug} preview={preview} />;
    case "gifts":
      return <GiftsSection section={section} />;
  }
}

/** The full invitation, used by the public page and the dashboard preview. */
export function InvitationView({ data, preview = false }: { data: InvitationData; preview?: boolean }) {
  const dateLabel = data.event ? eventDateParts(data.event.startsAt, data.event.timeZone).long : null;
  const template = getTemplate(data.template);
  const { photo, veil } = data.background;
  const style = {
    ...themeStyle(template, data.accent),
    ...(photo ? { "--inv-bg-photo": `url("${photo}")`, "--inv-veil": veilStrength(veil) } : {}),
  } as CSSProperties;

  return (
    <div
      className={`invitation tpl-${template.key} ${invitationFonts} flex-1`}
      style={style}
      {...themeAttributes(template, data.background.key)}
      suppressHydrationWarning
    >
      <div className="inv-backdrop" aria-hidden />
      <LangScript />
      <MusicProvider src={data.music?.url ?? null}>
        {data.intro && (
          <Envelope
            title={data.intro.title}
            subtitle={data.intro.subtitle}
            button={data.intro.button}
            couple={data.couple}
            dateLabel={dateLabel}
            autoplayMusic={Boolean(data.music?.autoplayOnOpen)}
          />
        )}
        <LanguageToggle />
        <main className="mx-auto w-full max-w-[480px] pb-24">
          {data.sections.map((section) => (
            <div key={section.type}>{renderSection(section, data, preview)}</div>
          ))}
          <footer className="px-5 pt-6 text-center text-xs tracking-[0.2em] text-[var(--inv-ink-soft)] uppercase">
            ♡ {data.couple.partner1.split(" ")[0]} &amp; {data.couple.partner2.split(" ")[0]}
          </footer>
        </main>
      </MusicProvider>
    </div>
  );
}
