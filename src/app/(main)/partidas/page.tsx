import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Clock, Coins, Gamepad2, Swords, Timer } from "lucide-react";
import { getOwnProfile } from "@/features/profiles/queries";
import { getOpenMatches, type OpenMatch } from "@/features/matches/queries";
import { formatCoins } from "@/features/economy/config";

export const metadata: Metadata = { title: "Mis partidas — Jahuga" };

function statusInfo(m: OpenMatch): { label: string; tone: "volt" | "ice"; rival: string } {
  const rival = m.rival ? (m.rival.display_name ?? `@${m.rival.nickname}`) : "Rival";
  if (m.status === "pending") {
    return m.role === "opponent"
      ? { label: `${rival} te retó — tocá para responder`, tone: "volt", rival }
      : { label: `Esperando que ${rival} acepte`, tone: "ice", rival };
  }
  // active
  return m.yourTurn
    ? { label: "Te toca jugar", tone: "volt", rival }
    : { label: `Esperando a ${rival}`, tone: "ice", rival };
}

export default async function PartidasPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  const matches = await getOpenMatches();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 lg:max-w-2xl">
      <header>
        <h1 className="font-ui text-3xl font-extrabold text-ice">Mis partidas</h1>
        <p className="mt-1 text-ice/60">Retomá cualquier juego en curso desde acá.</p>
      </header>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-ice/10 bg-navy/80 p-10 text-center">
          <Gamepad2 size={44} className="text-ice/40" />
          <p className="text-ice/60">No tenés partidas abiertas. Retá a alguien para empezar.</p>
          <Link
            href="/jugar/retar"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-volt px-5 font-ui font-extrabold text-volt-ink transition-transform active:scale-95"
          >
            <Swords size={18} /> Retar
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => {
            const info = statusInfo(m);
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-ice/10 bg-navy/80 p-4 backdrop-blur"
              >
                {m.rival?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.rival.photo_url} alt="" className="size-12 rounded-full object-cover" />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-full bg-navy-raised text-ice/60">
                    <Swords size={20} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-ui font-extrabold text-ice">{info.rival}</p>
                  <p className={`flex items-center gap-1.5 truncate text-sm ${info.tone === "volt" ? "text-volt" : "text-ice/50"}`}>
                    {m.mode === "live" ? <Clock size={13} /> : <Timer size={13} />}
                    {info.label}
                  </p>
                  {m.wager_amount !== null && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-gold">
                      <Coins size={12} /> {formatCoins(m.wager_amount)} en juego
                    </p>
                  )}
                </div>
                <Link
                  href={`/play/${m.id}`}
                  className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 font-ui text-sm font-extrabold transition-transform active:scale-95 ${
                    info.tone === "volt"
                      ? "bg-volt text-volt-ink"
                      : "border border-ice/20 text-ice"
                  }`}
                >
                  Ingresar <ChevronRight size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
