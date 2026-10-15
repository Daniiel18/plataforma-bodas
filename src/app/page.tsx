import Link from "next/link";

// Platform home. Each invitation lives at /[slug].
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="font-heading text-sm tracking-[0.3em] text-muted-foreground uppercase">❦</p>
      <h1 className="font-heading text-4xl md:text-5xl">Plataforma de Bodas</h1>
      <p className="max-w-md text-muted-foreground">La invitación estará disponible muy pronto.</p>
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">
        Panel de los novios
      </Link>
    </main>
  );
}
