/** Platform identity, shared by the landing page, metadata and legal pages. */

export const BRAND = "Lazo de Oro";

/** Public origin, used for canonical URLs, the sitemap and share links. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://lazodeoro.vercel.app").replace(/\/$/, "");

/** Public contact address (legal pages, footer, Google's consent screen). */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "lazosdeooroo@gmail.com";

/**
 * Google OAuth client ("Lazo de Oro web" in Google Cloud). Public by design:
 * the "Sign in with Google" button runs on our own domain with it.
 */
export const GOOGLE_CLIENT_ID = "329731616598-q7fgv51c9f7hjnqdjahfsd8rnteq3bkf.apps.googleusercontent.com";
