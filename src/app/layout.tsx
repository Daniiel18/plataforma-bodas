import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono, Great_Vibes } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Script face of the "Lazo de Oro" wordmark. */
const brandScript = Great_Vibes({
  variable: "--font-brand-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} · Invitaciones de boda digitales gratis`, template: `%s · ${BRAND}` },
  description:
    "Crea gratis la web de tu boda: invitación con confirmación de asistencia, cuenta regresiva, fotos en 3D, música, mapa y regalos. En español e inglés.",
  applicationName: BRAND,
  // Google Search Console ownership of the domain (needed for Google sign-in brand verification).
  verification: { google: "Dm-6L8QBbLLn6qD_Dv6v7vv_ELVBB_l-IHPnSqR4q3s" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      // The invitation sets `lang` to the guest's language before hydration.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${brandScript.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
