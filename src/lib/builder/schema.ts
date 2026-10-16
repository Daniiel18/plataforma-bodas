import { z } from "zod";

import { appearanceSchema } from "@/lib/appearance";
import { SECTION_TYPES, sectionSchemas, type SectionContent, type SectionType } from "@/lib/sections";

import { slugProblem } from "./draft";

/**
 * Server-side check of a builder draft before it becomes a wedding. The draft
 * comes from the browser, so every field is validated with the same schemas
 * the dashboard uses.
 */

const translationsSchema = z.record(
  z.string().max(60),
  z.object({ src: z.string().max(600), en: z.string().max(900), manual: z.boolean().optional() }),
);

const timeZoneSchema = z.string().refine((zone) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}, "Zona horaria no válida");

const sectionsSchema = z.object(
  Object.fromEntries(
    SECTION_TYPES.map((type) => [type, z.object({ visible: z.boolean(), content: sectionSchemas[type] })]),
  ) as { [T in SectionType]: z.ZodObject<{ visible: z.ZodBoolean; content: (typeof sectionSchemas)[T] }> },
);

export const draftSchema = z.object({
  couple: z.object({
    partner1: z.string().trim().min(1, "Escribe los dos nombres").max(80),
    partner2: z.string().trim().min(1, "Escribe los dos nombres").max(80),
  }),
  event: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha de la boda"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Elige la hora"),
    timeZone: timeZoneSchema,
  }),
  appearance: appearanceSchema,
  slug: z.string().refine((slug) => slugProblem(slug) === null, "Ese enlace no es válido"),
  sections: sectionsSchema,
  translations: z.partialRecord(z.enum(SECTION_TYPES), translationsSchema).default({}),
  gift: z.object({
    holderName: z.string().trim().max(80),
    handle: z.string().trim().max(120),
    note: z.string().trim().max(200),
  }),
  rsvp: z.object({
    deadline: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    maxCompanions: z.number().int().min(0).max(10),
    companionsMode: z.enum(["names", "count"]),
    guestbookPublic: z.boolean(),
  }),
});

export type ValidDraft = z.output<typeof draftSchema>;

/** Typed content of one section of a validated draft. */
export const draftContent = <T extends SectionType>(draft: ValidDraft, type: T) =>
  draft.sections[type].content as SectionContent<T>;
