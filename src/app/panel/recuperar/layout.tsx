import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recuperar acceso" };

export default function RecoverLayout({ children }: LayoutProps<"/panel/recuperar">) {
  return children;
}
