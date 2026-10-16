import type { Metadata, Viewport } from "next";

/** The dashboard can be installed as an app ("Mi boda") to get notifications on the phone. */
export const metadata: Metadata = {
  manifest: "/panel.webmanifest",
  appleWebApp: { capable: true, title: "Mi boda", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#6f5b4e" };

export default function AdminLayout({ children }: LayoutProps<"/panel">) {
  return children;
}
