import { definition, type PenalesState } from "@/games/penales/definition";
import type { Match, MatchMoveRow } from "./types";

/**
 * Reconstruye el estado del engine desde las filas de match_moves.
 * Determinístico: mismas filas + mismo seed = mismo estado.
 */
export function buildState(match: Match, moves: MatchMoveRow[]): PenalesState {
  if (!match.opponent_id) throw new Error("match sin oponente");
  const players: [string, string] = [match.challenger_id, match.opponent_id];
  let state = definition.initialState(players, match.seed);
  for (const player of players) {
    const own = moves
      .filter((m) => m.player_id === player)
      .sort((a, b) => a.round - b.round);
    for (const row of own) {
      state = definition.applyMove(state, player, row.move);
    }
  }
  return state;
}
