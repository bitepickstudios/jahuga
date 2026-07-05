"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimMission } from "@/features/missions/actions";
import { formatCoins } from "@/features/economy/config";
import type { MissionCard } from "@/features/missions/queries";

export function MissionList({ missions }: { missions: MissionCard[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function onClaim(id: string) {
    setBusy(id);
    await claimMission(id);
    setBusy(null);
    router.refresh();
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {missions.map((m) => {
        const pct = Math.min(100, Math.round((m.progress / m.needed) * 100));
        return (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-2xl border border-ice/10 bg-navy/80 p-3.5 backdrop-blur"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-ui font-extrabold text-ice">{m.title}</p>
                <span className="shrink-0 font-ui text-xs font-bold text-gold">
                  🪙 {formatCoins(m.reward)}
                </span>
              </div>
              <p className="truncate text-xs text-ice/50">{m.description}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ice/10">
                <div
                  className={`h-full rounded-full ${m.completed ? "bg-volt" : "bg-ice/40"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            {m.claimed ? (
              <span className="shrink-0 text-xs font-bold text-ice/40">✓ Reclamada</span>
            ) : m.completed ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => onClaim(m.id)}
                className="shrink-0 rounded-xl bg-volt px-3.5 py-2 font-ui text-sm font-extrabold text-volt-ink transition-transform active:scale-95 disabled:opacity-60"
              >
                {busy === m.id ? "..." : "Reclamar"}
              </button>
            ) : (
              <span className="shrink-0 font-ui text-sm font-bold text-ice/50">
                {Math.min(m.progress, m.needed)}/{m.needed}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
