/**
 * Bot nivel 1 — aleatorio: direcciones uniformes, potencia y timing aleatorios.
 * Spec §8. Niveles 2 (ponderado) y 3 (perfilador) quedan para fases futuras.
 */
import type { Direction, KickPower, RoundMove, SaveTiming } from "./engine";

const DIRECTIONS: Direction[] = ["left", "center", "right"];
const POWERS: KickPower[] = ["placed", "strong"];
const TIMINGS: SaveTiming[] = ["wait", "dive_early"];

function pick<T>(options: T[], rng: () => number): T {
  return options[Math.floor(rng() * options.length)];
}

export function botMove(rng: () => number = Math.random): RoundMove {
  return {
    kick: { direction: pick(DIRECTIONS, rng), power: pick(POWERS, rng) },
    save: { direction: pick(DIRECTIONS, rng), timing: pick(TIMINGS, rng) },
  };
}
