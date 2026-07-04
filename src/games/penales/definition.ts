/**
 * Punto de entrada del contrato Game SDK para penales (ver docs/arquitectura.md).
 * features/* importa de acá, nunca del engine directo.
 */
export { penalesGame as definition, getRoundResults, PENALES_CONFIG } from "./engine";
export type { PenalesState, RoundMove, RoundResult, PenaltyResult } from "./engine";
