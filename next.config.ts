import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  // Off on purpose: the first visit to an invitation that was not prerendered
  // waits for its data, so unknown or unpublished slugs return a real 404
  // instead of a 200 App Shell.
  partialPrefetching: false,
  async redirects() {
    return [
      // The couple's dashboard moved from /admin to /panel; /admin is now the
      // platform's back office (couples who land there are sent to /panel).
      { source: "/admin/login", destination: "/panel/login", permanent: false },
      { source: "/admin/recuperar", destination: "/panel/recuperar", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // The landing page shows the demo inside a phone frame (same origin only).
        source: "/demo/:path*",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        // The builder's review step shows the draft inside a phone frame.
        source: "/crear/vista-previa",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        // Notifications service worker: always serve the latest version.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  images: {
    // Photos, cover and QR the couple upload to Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
