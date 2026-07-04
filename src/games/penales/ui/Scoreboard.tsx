"use client";

import { PENALES_CONFIG, type PenaltyResult } from "../engine";

function RoundDots({ results, total }: { results: PenaltyResult[]; total: number }) {
  return (
    <div className="flex gap-1.5 text-base leading-none">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        if (r === "goal") return <span key={i}>⚽</span>;
        if (r === "saved" || r === "missed") return <span key={i}>❌</span>;
        return (
          <span key={i} className="text-chalk/30">
            ·
          </span>
        );
      })}
    </div>
  );
}

/** Marcador tipo tanda real (⚽⚽❌⚽·) con el score grande en tipografía de cartel. */
export function Scoreboard({
  names,
  results,
  scores,
}: {
  names: [string, string];
  /** Resultados del penal pateado por cada jugador, en orden de ronda. */
  results: [PenaltyResult[], PenaltyResult[]];
  scores: [number, number];
}) {
  const totalDots = Math.max(PENALES_CONFIG.rounds, results[0].length, results[1].length);
  return (
    <div className="w-full max-w-sm rounded-md border border-chalk/15 bg-night px-4 py-3">
      {[0, 1].map((i) => (
        <div key={i} className={`flex items-center justify-between gap-3 ${i === 0 ? "mb-2" : ""}`}>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-chalk/90">{names[i]}</span>
          <RoundDots results={results[i]} total={totalDots} />
          <span className="w-8 text-right font-display text-2xl text-chalk">{scores[i]}</span>
        </div>
      ))}
    </div>
  );
}
