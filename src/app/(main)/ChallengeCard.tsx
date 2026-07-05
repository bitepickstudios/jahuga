"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondChallenge } from "@/features/matches/actions";
import { formatCoins } from "@/features/economy/config";

/** Card de reto pendiente (DESIGN.md §7): header rojo, aceptar/rechazar inline. */
export function ChallengeCard({
  matchId,
  challengerName,
  challengerPhoto,
  mode,
  wagerAmount = null,
}: {
  matchId: string;
  challengerName: string;
  challengerPhoto: string | null;
  mode: "live" | "async";
  wagerAmount?: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  async function respond(accept: boolean) {
    setBusy(true);
    const result = await respondChallenge(matchId, accept);
    if (result.error) {
      setBusy(false);
      return;
    }
    if (accept) router.push(`/play/${matchId}`);
    else {
      setGone(true);
      router.refresh();
    }
  }

  if (gone) return null;

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-danger/40 bg-navy/85 backdrop-blur">
      <div className="flex items-center justify-between bg-danger px-4 py-2">
        <span className="font-ui text-sm font-extrabold uppercase tracking-wide text-ice">
          Reto pendiente
        </span>
        <span className="rounded-full bg-night/40 px-2.5 py-0.5 font-ui text-[11px] font-bold text-ice/90">
          {mode === "live" ? "⏱ en vivo" : "🕰 async"}
        </span>
      </div>
      <div className="flex items-center gap-3 p-4">
        {challengerPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={challengerPhoto} alt="" className="size-12 rounded-full border border-ice/20 object-cover" />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-full bg-navy-raised text-xl">⚔️</span>
        )}
        <p className="text-ice">
          <strong className="font-ui font-extrabold">{challengerName}</strong> te retó a penales
          {wagerAmount !== null && (
            <span className="text-gold"> por 🪙 {formatCoins(wagerAmount)}</span>
          )}
        </p>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => respond(true)}
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-volt font-ui font-extrabold text-volt-ink transition-transform active:scale-95 disabled:opacity-60"
        >
          ✓ Aceptar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond(false)}
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-danger font-ui font-bold text-danger active:bg-danger/10 disabled:opacity-60"
        >
          ✕ Rechazar
        </button>
      </div>
    </div>
  );
}
