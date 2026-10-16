/** Platform identity, shared by the landing page, metadata and legal pages. */

export const BRAND = "Lazo de Oro";

/** Public origin, used for canonical URLs, the sitemap and share links. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://lazodoro.vercel.app").replace(/\/$/, "");

/** Public contact address (legal pages, footer, Google's consent screen). */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "lazosdeooroo@gmail.com";
