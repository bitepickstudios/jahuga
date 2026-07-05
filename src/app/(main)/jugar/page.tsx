import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";

export const metadata: Metadata = { title: "Jugar — Jahuga" };

export default async function JugarPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 lg:max-w-2xl">
      <h1 className="font-ui text-3xl font-extrabold text-ice">Elegí tu juego</h1>

      <section className="overflow-hidden rounded-2xl border border-ice/10 bg-navy/80">
        <div className="relative h-44">
          <Image
            src="/assets/jahuga__game_bg_penaltys.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
          <h2 className="absolute bottom-3 left-4 font-ui text-2xl font-extrabold text-ice">
            ⚽ Tandas de Penales
          </h2>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-ice/60">Leé al rival. Cinco penales por lado, sin reflejos: psicología.</p>
          <Link
            href="/jugar/retar"
            className="flex min-h-12 items-center justify-center rounded-xl bg-volt px-6 font-ui text-lg font-extrabold text-volt-ink shadow-[0_4px_0_rgba(0,0,0,0.35)] transition-transform active:translate-y-0.5 active:shadow-none"
          >
            Retar a alguien
          </Link>
          <Link
            href="/play/local"
            className="flex min-h-12 items-center justify-between rounded-xl border border-ice/15 bg-night/40 px-5 font-ui font-bold text-ice/90 active:bg-ice/5"
          >
            <span>🤖 Vs la máquina · local</span>
            <span className="text-ice/40">›</span>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-ice/15 p-5 text-center">
        <p className="text-ice/40">Trivia, Cartas RPG y Modo Torneo: próximamente.</p>
      </section>
    </main>
  );
}
