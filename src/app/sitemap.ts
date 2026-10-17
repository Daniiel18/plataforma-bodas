import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { TEMPLATES } from "@/lib/templates";

/** Public pages for search engines. Couples' invitations are private (noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  });
  return [
    page("/", 1),
    page("/crear", 0.9),
    page("/demo", 0.8),
    ...TEMPLATES.map((template) => page(`/demo/${template.key}`, 0.7)),
    page("/privacidad", 0.2),
    page("/terminos", 0.2),
    page("/donar", 0.3),
  ];
}
