export type Wedding = {
  id: string;
  slug: string;
  partner1_name: string;
  partner2_name: string;
  event_starts_at: string | null;
  timezone: string | null;
  rsvp_deadline: string | null;
  max_companions: number;
  template_key: string;
  theme_overrides: Record<string, unknown>;
  is_published: boolean;
  status: "draft" | "active" | "read_only" | "archived" | "suspended";
  companions_mode: "names" | "count";
  guestbook_public: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Companion = {
  id: string;
  full_name: string;
  position: number;
};

export type Wish = {
  id: string;
  rsvp_id: string;
  message: string;
  locale: "es" | "en";
  is_read: boolean;
  /** Kept out of the invitation's public guestbook by the couple. */
  is_hidden: boolean;
  created_at: string;
};

export type Rsvp = {
  id: string;
  wedding_id: string;
  full_name: string;
  attending: boolean;
  /** Companions when the wedding only counts them (null when they are named). */
  companions_count: number | null;
  locale: "es" | "en";
  change_count: number;
  admin_note: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

/** People coming with a guest, named or only counted. */
export const companionsOf = (r: { companions_count: number | null; rsvp_companions: unknown[] }) =>
  r.companions_count ?? r.rsvp_companions.length;

export type RsvpWithDetails = Rsvp & {
  rsvp_companions: Companion[];
  wishes: Pick<Wish, "id" | "is_read">[];
};

export type WeddingStats = {
  responses: number;
  attending: number;
  declined: number;
  companions: number;
  total_people: number;
  wishes: number;
  unread_wishes: number;
};

export type DuplicateMatch = {
  rsvp_id: string;
  name: string;
  matched_rsvp_id: string;
  matched_name: string;
  score: number;
};

/** Standard result of form Server Actions. */
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
