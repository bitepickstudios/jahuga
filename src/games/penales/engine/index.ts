/**
 * Engine de Tanda de Penales — lógica PURA (sin React ni Supabase).
 * Spec: docs/minijuego-penales.md. Balance en PENALES_CONFIG (§4).
 */
import type { GameDefinition, MatchOutcome } from "@/games/sdk/types";

export const PENALES_CONFIG = {
  rounds: 5,
  pMissStrong: 0.15,
  suddenDeathMaxRounds: 10, // después: gana quien más atajadas hizo; si persiste, empate
} as const;

export type Direction = "left" | "center" | "right";
export type KickPower = "placed" | "strong";
export type SaveTiming = "wait" | "dive_early";

export interface Kick {
  direction: Direction;
  power: KickPower;
}

export interface Save {
  direction: Direction;
  timing: SaveTiming;
}

/** Movimiento de una ronda: cada jugador patea un penal y ataja el del rival. */
export interface RoundMove {
  kick: Kick;
  save: Save;
}

export type PenaltyResult = "goal" | "saved" | "missed";

export interface PenalesState {
  players: [string, string];
  seed: string;
  /** Movimientos commiteados por jugador, índice = ronda - 1. */
  moves: Record<string, RoundMove[]>;
}

export interface RoundResult {
  round: number;
  /** Resultado del penal PATEADO por cada jugador. */
  results: Record<string, PenaltyResult>;
}

const DIRECTIONS: readonly string[] = ["left", "center", "right"];
const POWERS: readonly string[] = ["placed", "strong"];
const TIMINGS: readonly string[] = ["wait", "dive_early"];

/**
 * Único punto de azar (spec §3.3): derivado de seed + ronda + pateador con FNV-1a.
 * Reproducible y no re-rolleable.
 */
export function missRollFor(seed: string, round: number, kickerId: string): number {
  const input = `${seed}:${round}:${kickerId}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x1_0000_0000;
}

/** Matriz de resolución de la spec §3. */
export function resolvePenalty(kick: Kick, save: Save, missRoll: number): PenaltyResult {
  if (kick.power === "strong" && missRoll < PENALES_CONFIG.pMissStrong) return "missed";
  if (save.direction !== kick.direction) return "goal";
  // El arquero adivinó la dirección
  if (kick.direction === "center") return save.timing === "wait" ? "saved" : "goal"; // §3.4
  if (kick.power === "placed") return "saved";
  return save.timing === "wait" ? "goal" : "saved"; // fuerte: castiga al arquero pasivo
}

/** Rondas con ambos movimientos commiteados, resueltas en orden (para revelación y outcome). */
export function getRoundResults(state: PenalesState): RoundResult[] {
  const [a, b] = state.players;
  const completed = Math.min(state.moves[a].length, state.moves[b].length);
  const results: RoundResult[] = [];
  for (let i = 0; i < completed; i++) {
    const round = i + 1;
    results.push({
      round,
      results: {
        [a]: resolvePenalty(state.moves[a][i].kick, state.moves[b][i].save, missRollFor(state.seed, round, a)),
        [b]: resolvePenalty(state.moves[b][i].kick, state.moves[a][i].save, missRollFor(state.seed, round, b)),
      },
    });
  }
  return results;
}

function isValidRoundMove(move: RoundMove): boolean {
  return (
    typeof move === "object" &&
    move !== null &&
    DIRECTIONS.includes(move.kick?.direction) &&
    POWERS.includes(move.kick?.power) &&
    DIRECTIONS.includes(move.save?.direction) &&
    TIMINGS.includes(move.save?.timing)
  );
}

function initialState(players: [string, string], seed: string): PenalesState {
  return { players, seed, moves: { [players[0]]: [], [players[1]]: [] } };
}

function getOutcome(state: PenalesState): MatchOutcome | null {
  const [a, b] = state.players;
  const rounds = getRoundResults(state);
  if (rounds.length < PENALES_CONFIG.rounds) return null; // la tanda se juega entera (§5)

  const goals: Record<string, number> = { [a]: 0, [b]: 0 };
  const saves: Record<string, number> = { [a]: 0, [b]: 0 };
  const countRound = (rr: RoundResult) => {
    for (const p of [a, b]) {
      const keeper = p === a ? b : a;
      if (rr.results[p] === "goal") goals[p]++;
      if (rr.results[p] === "saved") saves[keeper]++;
    }
  };

  const outcome = (winnerId: string | null, suddenDeathRounds: number): MatchOutcome => ({
    winnerId,
    scores: { ...goals },
    stats: { saves: { ...saves }, suddenDeathRounds },
  });

  for (const rr of rounds.slice(0, PENALES_CONFIG.rounds)) countRound(rr);
  if (goals[a] !== goals[b]) {
    return outcome(goals[a] > goals[b] ? a : b, 0);
  }

  // Muerte súbita alternada: define el primer desnivel por ronda (§ roadmap/spec)
  const suddenDeath = rounds.slice(PENALES_CONFIG.rounds, PENALES_CONFIG.rounds + PENALES_CONFIG.suddenDeathMaxRounds);
  for (const [i, rr] of suddenDeath.entries()) {
    countRound(rr);
    const aScored = rr.results[a] === "goal";
    const bScored = rr.results[b] === "goal";
    if (aScored !== bScored) return outcome(aScored ? a : b, i + 1);
  }

  if (suddenDeath.length < PENALES_CONFIG.suddenDeathMaxRounds) return null; // sigue la muerte súbita

  // Se agotó: gana quien más atajadas hizo; si persiste, empate (§4)
  if (saves[a] !== saves[b]) return outcome(saves[a] > saves[b] ? a : b, suddenDeath.length);
  return outcome(null, suddenDeath.length);
}

function validateMove(state: PenalesState, playerId: string, move: RoundMove): boolean {
  if (!state.players.includes(playerId as (typeof state.players)[number])) return false;
  if (!isValidRoundMove(move)) return false;
  if (getOutcome(state) !== null) return false;

  const [a, b] = state.players;
  const mine = state.moves[playerId].length;
  const next = mine + 1;
  if (next <= PENALES_CONFIG.rounds) return true; // regulación: se puede adelantar (modo async)
  // Muerte súbita: ronda por ronda, ambos parejos y con rondas disponibles
  const other = state.moves[playerId === a ? b : a].length;
  if (mine !== other) return false;
  return next <= PENALES_CONFIG.rounds + PENALES_CONFIG.suddenDeathMaxRounds;
}

function applyMove(state: PenalesState, playerId: string, move: RoundMove): PenalesState {
  return {
    ...state,
    moves: { ...state.moves, [playerId]: [...state.moves[playerId], move] },
  };
}

export const penalesGame: GameDefinition<RoundMove, PenalesState> = {
  id: "penales",
  name: "Tanda de Penales",
  minPlayers: 2,
  maxPlayers: 2,
  modes: ["live", "async"],
  initialState,
  validateMove,
  applyMove,
  getOutcome,
};
