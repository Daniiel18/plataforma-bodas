import type { Metadata, Viewport } from "next";

/** El panel se puede instalar como app ("Mi boda") para recibir avisos en el celular. */
export const metadata: Metadata = {
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Mi boda", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#6f5b4e" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
