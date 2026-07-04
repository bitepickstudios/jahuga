import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";

export const metadata: Metadata = { title: "Jugar — Lobby" };

export default async function JugarPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-chalk/60 underline underline-offset-4">
          ← Lobby
        </Link>
      </header>

      <h1 className="font-display text-4xl uppercase text-chalk">Elegí tu juego</h1>

      {/* Card del minijuego (scroll vertical de cards cuando haya más de uno — F6) */}
      <section className="rounded-lg border border-chalk/15 bg-night p-5">
        <p className="text-sm uppercase tracking-widest text-chalk/50">Minijuego</p>
        <h2 className="font-display text-3xl uppercase text-chalk">⚽ Tanda de Penales</h2>
        <p className="mt-1 text-sm text-chalk/60">Leé al rival. Cinco penales por lado.</p>
        <div className="mt-4 flex flex-col gap-3">
          <Link
            href="/jugar/retar"
            className="flex min-h-12 items-center justify-center rounded-md bg-albirroja px-6 font-display text-xl uppercase tracking-wide text-chalk transition-transform active:scale-95"
          >
            Retar a alguien
          </Link>
          <Link
            href="/play/local"
            className="flex min-h-12 items-center justify-center rounded-md border border-chalk/25 px-6 text-chalk/90 active:bg-chalk/5"
          >
            Vs la máquina · local
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-chalk/15 p-5 text-center">
        <p className="text-chalk/40">Más minijuegos, próximamente.</p>
      </section>
    </main>
  );
}
