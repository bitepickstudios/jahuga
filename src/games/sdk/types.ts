/**
 * Contrato Game SDK — ver docs/arquitectura.md.
 * Todo minijuego implementa GameDefinition; la plataforma no conoce sus reglas.
 */

export interface GameDefinition<Move, State> {
  id: string; // "penales"
  name: string; // "Tanda de Penales"
  minPlayers: 2;
  maxPlayers: 2; // v1: solo 1v1
  modes: ("live" | "async")[];

  /** Valida un movimiento antes de commitearlo (corre en server) */
  validateMove(state: State, playerId: string, move: Move): boolean;

  /** Reduce el estado — determinístico, puro */
  applyMove(state: State, playerId: string, move: Move): State;

  /** ¿Terminó? Si terminó, el resultado */
  getOutcome(state: State): MatchOutcome | null;

  initialState(players: [string, string], seed: string): State;
}

export interface MatchOutcome {
  winnerId: string | null; // null = empate (si el juego lo permite)
  scores: Record<string, number>;
  stats: Record<string, unknown>; // libre por juego (para perfiles/logros)
}
