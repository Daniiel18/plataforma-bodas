"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { cleanContent, type SectionType } from "@/lib/sections";

import { createDraft, DRAFT_VERSION, STEPS, suggestSlug, type BuilderDraft, type LocalMedia } from "./draft";

type MediaSlot = "cover" | "audio" | "qr" | "background";

type BuilderState = {
  draft: BuilderDraft | null;
  step: number;
  /** Starts a draft if there is none (optionally with a template from a demo). */
  start: (template?: string | null) => void;
  /** Throws the draft away and starts over. */
  reset: () => void;
  goTo: (step: number) => void;
  setCouple: (patch: Partial<BuilderDraft["couple"]>) => void;
  setEvent: (patch: Partial<BuilderDraft["event"]>) => void;
  setAppearance: (patch: Partial<BuilderDraft["appearance"]>) => void;
  setSlug: (slug: string) => void;
  setSection: (type: SectionType, content: unknown) => void;
  setSectionVisible: (type: SectionType, visible: boolean) => void;
  setMedia: (slot: MediaSlot, media: LocalMedia | null) => void;
  setGallery: (photos: LocalMedia[]) => void;
  setGift: (patch: Partial<BuilderDraft["gift"]>) => void;
  setRsvp: (patch: Partial<BuilderDraft["rsvp"]>) => void;
};

const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

export const useBuilder = create<BuilderState>()(
  persist(
    (set) => {
      /** Applies a change to the draft (no-op before it exists). */
      const edit = (fn: (draft: BuilderDraft) => BuilderDraft) =>
        set((state) => (state.draft ? { draft: fn(state.draft) } : {}));

      return {
        draft: null,
        step: 0,
        start: (template) =>
          set((state) => {
            if (!state.draft) return { draft: createDraft(template, browserTimeZone()), step: 0 };
            // Coming from "Crea la tuya con esta plantilla" with a draft already started.
            if (template && template !== state.draft.appearance.template) {
              return {
                draft: {
                  ...state.draft,
                  appearance: { ...state.draft.appearance, template: createDraft(template).appearance.template },
                },
              };
            }
            return {};
          }),
        reset: () => set({ draft: createDraft(null, browserTimeZone()), step: 0 }),
        goTo: (step) => set({ step: Math.max(0, Math.min(STEPS.length - 1, step)) }),
        setCouple: (patch) =>
          edit((d) => {
            const couple = { ...d.couple, ...patch };
            return { ...d, couple, slug: d.slugEdited ? d.slug : suggestSlug(couple.partner1, couple.partner2) };
          }),
        setEvent: (patch) => edit((d) => ({ ...d, event: { ...d.event, ...patch } })),
        setAppearance: (patch) => edit((d) => ({ ...d, appearance: { ...d.appearance, ...patch } })),
        setSlug: (slug) => edit((d) => ({ ...d, slug, slugEdited: true })),
        setSection: (type, content) =>
          edit((d) => ({
            ...d,
            sections: { ...d.sections, [type]: { ...d.sections[type], content: cleanContent(type, content) } },
          })),
        setSectionVisible: (type, visible) =>
          edit((d) => ({ ...d, sections: { ...d.sections, [type]: { ...d.sections[type], visible } } })),
        setMedia: (slot, media) => edit((d) => ({ ...d, media: { ...d.media, [slot]: media } })),
        setGallery: (photos) => edit((d) => ({ ...d, media: { ...d.media, gallery: photos } })),
        setGift: (patch) => edit((d) => ({ ...d, gift: { ...d.gift, ...patch } })),
        setRsvp: (patch) => edit((d) => ({ ...d, rsvp: { ...d.rsvp, ...patch } })),
      };
    },
    {
      name: "lazodoro-draft",
      version: DRAFT_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ draft: state.draft, step: state.step }),
    },
  ),
);
