import type { RoundMove } from "@/games/penales/definition";

export type MatchStatus = "pending" | "active" | "resolved" | "declined" | "expired" | "abandoned";
export type MatchMode = "live" | "async";

export interface Match {
  id: string;
  game_id: string;
  challenger_id: string;
  opponent_id: string | null;
  is_vs_bot: boolean;
  bot_level: number | null;
  mode: MatchMode;
  status: MatchStatus;
  seed: string;
  state: unknown;
  winner_id: string | null;
  scores: Record<string, number> | null;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
}

export interface MatchMoveRow {
  id: string;
  match_id: string;
  player_id: string;
  round: number;
  move: RoundMove;
  created_at: string;
}

/** Datos mínimos del rival/retador que un participante puede ver en contexto de partida. */
export interface MatchPlayer {
  id: string;
  nickname: string;
  display_name: string | null;
  photo_url: string | null;
}
