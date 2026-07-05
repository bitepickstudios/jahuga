"use client";

import { X } from "lucide-react";
import { PENALES_CONFIG, type PenaltyResult } from "../engine";

/** Puntito de cada penal: convertido (volt lleno) · atajado/errado (X) · pendiente (hueco). */
function RoundDots({ results, total }: { results: PenaltyResult[]; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        if (r === "goal") {
          return <span key={i} className="size-3.5 rounded-full bg-volt shadow-[0_0_6px_rgba(200,245,49,0.6)]" />;
        }
        if (r === "saved" || r === "missed") {
          return (
            <span key={i} className="flex size-3.5 items-center justify-center rounded-full bg-danger/20 text-danger">
              <X size={11} strokeWidth={3} />
            </span>
          );
        }
        return <span key={i} className="size-3.5 rounded-full border border-ice/25" />;
      })}
    </div>
  );
}

/** Marcador tipo tanda real con el score grande en tipografía de cartel. */
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
    <div className="w-full max-w-sm rounded-2xl border border-ice/15 bg-night/90 px-4 py-3 backdrop-blur">
      {[0, 1].map((i) => (
        <div key={i} className={`flex items-center justify-between gap-3 ${i === 0 ? "mb-2" : ""}`}>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ice/90">{names[i]}</span>
          <RoundDots results={results[i]} total={totalDots} />
          <span className="w-8 text-right font-display text-2xl text-ice">{scores[i]}</span>
        </div>
      ))}
    </div>
  );
}
