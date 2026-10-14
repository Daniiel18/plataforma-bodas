import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recuperar acceso" };

export default function RecoverLayout({ children }: LayoutProps<"/admin/recuperar">) {
  return children;
}
