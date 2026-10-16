import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Crawlers may visit everything public; invitations opt out with a noindex tag
 * (they must stay crawlable for search engines to see it).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/auth"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
