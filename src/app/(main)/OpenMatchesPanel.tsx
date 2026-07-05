import Link from "next/link";
import { ChevronRight, Clock, Gamepad2, Timer } from "lucide-react";
import type { OpenMatch } from "@/features/matches/queries";

function label(m: OpenMatch): { text: string; tone: "volt" | "ice" } {
  const rival = m.rival ? (m.rival.display_name ?? `@${m.rival.nickname}`) : "Rival";
  if (m.status === "pending") return { text: `Esperando que ${rival} acepte`, tone: "ice" };
  return m.yourTurn ? { text: "Te toca jugar", tone: "volt" } : { text: `Esperando a ${rival}`, tone: "ice" };
}

/** Partidas en curso en el lobby (activas + enviadas), con "Ver todas". */
export function OpenMatchesPanel({ matches, total }: { matches: OpenMatch[]; total: number }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ice/10 bg-gradient-to-b from-navy/85 to-navy/55 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-volt/15 text-volt">
            <Gamepad2 size={17} />
          </span>
          <h2 className="font-ui text-base font-extrabold text-ice">Partidas en curso</h2>
        </div>
        <Link href="/partidas" className="shrink-0 font-ui text-xs font-bold text-volt">
          Ver todas{total > matches.length ? ` (${total})` : ""} ›
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {matches.map((m) => {
          const rival = m.rival ? (m.rival.display_name ?? `@${m.rival.nickname}`) : "Rival";
          const { text, tone } = label(m);
          return (
            <li key={m.id}>
              <Link
                href={`/play/${m.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-ice/10 bg-night/40 p-2.5 transition-colors hover:border-volt/30 active:bg-ice/5"
              >
                {m.rival?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.rival.photo_url} alt="" className="size-9 rounded-full object-cover" />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-navy-raised text-ice/60">
                    {m.mode === "live" ? <Clock size={16} /> : <Timer size={16} />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-ui text-sm font-bold text-ice">{rival}</p>
                  <p className={`truncate text-xs ${tone === "volt" ? "font-bold text-volt" : "text-ice/50"}`}>
                    {text}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-ice/40" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
