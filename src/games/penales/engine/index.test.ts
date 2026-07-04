import { describe, expect, test } from "vitest";
import {
  PENALES_CONFIG,
  type PenalesState,
  type RoundMove,
  getRoundResults,
  missRollFor,
  penalesGame,
  resolvePenalty,
} from "./index";

const [P1, P2] = ["player-1", "player-2"] as const;

const NO_MISS = 0.99; // roll por encima de pMissStrong
const MISS = 0.01; // roll por debajo de pMissStrong

function kick(direction: "left" | "center" | "right", power: "placed" | "strong" = "placed") {
  return { direction, power };
}

function save(direction: "left" | "center" | "right", timing: "wait" | "dive_early" = "wait") {
  return { direction, timing };
}

/** Movimiento neutro sin azar: patada colocada a la izquierda, arquero espera a la derecha → gol seguro. */
const SURE_GOAL: RoundMove = { kick: kick("left"), save: save("right") };
/** El arquero adivina una colocada → atajada segura. */
const SURE_SAVE: RoundMove = { kick: kick("left"), save: save("left") };

function playRounds(state: PenalesState, rounds: { p1: RoundMove; p2: RoundMove }[]): PenalesState {
  let s = state;
  for (const r of rounds) {
    s = penalesGame.applyMove(s, P1, r.p1);
    s = penalesGame.applyMove(s, P2, r.p2);
  }
  return s;
}

/** Tanda de 5 rondas donde P1 convierte `p1Goals` y P2 convierte `p2Goals` (sin patadas fuertes → sin azar). */
function regulation(p1Goals: number, p2Goals: number): { p1: RoundMove; p2: RoundMove }[] {
  return Array.from({ length: PENALES_CONFIG.rounds }, (_, i) => ({
    // el kick de p1 se enfrenta al save de p2 y viceversa
    p1: { kick: (i < p1Goals ? SURE_GOAL : SURE_SAVE).kick, save: (i < p2Goals ? SURE_GOAL : SURE_SAVE).save },
    p2: { kick: (i < p2Goals ? SURE_GOAL : SURE_SAVE).kick, save: (i < p1Goals ? SURE_GOAL : SURE_SAVE).save },
  }));
}

describe("resolvePenalty — matriz de la spec §3", () => {
  test("arquero a dirección equivocada + colocado → gol (ambos timings)", () => {
    expect(resolvePenalty(kick("left", "placed"), save("right", "wait"), NO_MISS)).toBe("goal");
    expect(resolvePenalty(kick("left", "placed"), save("right", "dive_early"), NO_MISS)).toBe("goal");
  });

  test("arquero a dirección equivocada + fuerte → gol, salvo errado", () => {
    expect(resolvePenalty(kick("right", "strong"), save("left", "wait"), NO_MISS)).toBe("goal");
    expect(resolvePenalty(kick("right", "strong"), save("left", "wait"), MISS)).toBe("missed");
  });

  test("adivinó + colocado → atajada (ambos timings)", () => {
    expect(resolvePenalty(kick("left", "placed"), save("left", "wait"), NO_MISS)).toBe("saved");
    expect(resolvePenalty(kick("left", "placed"), save("left", "dive_early"), NO_MISS)).toBe("saved");
  });

  test("adivinó + fuerte + esperar → gol (no llega a reaccionar)", () => {
    expect(resolvePenalty(kick("right", "strong"), save("right", "wait"), NO_MISS)).toBe("goal");
  });

  test("adivinó + fuerte + adelantarse → atajada", () => {
    expect(resolvePenalty(kick("right", "strong"), save("right", "dive_early"), NO_MISS)).toBe("saved");
  });

  test("toda patada fuerte puede errarse, incluso adivinada", () => {
    expect(resolvePenalty(kick("right", "strong"), save("right", "wait"), MISS)).toBe("missed");
    expect(resolvePenalty(kick("right", "strong"), save("right", "dive_early"), MISS)).toBe("missed");
  });

  test("excepción del centro: centro + arquero espera en el centro → atajada", () => {
    expect(resolvePenalty(kick("center", "placed"), save("center", "wait"), NO_MISS)).toBe("saved");
    expect(resolvePenalty(kick("center", "strong"), save("center", "wait"), NO_MISS)).toBe("saved");
  });

  test("excepción del centro: centro + arquero se adelanta → gol", () => {
    expect(resolvePenalty(kick("center", "placed"), save("center", "dive_early"), NO_MISS)).toBe("goal");
  });

  test("centro + arquero a un costado → gol (no adivinó)", () => {
    expect(resolvePenalty(kick("center", "placed"), save("left", "wait"), NO_MISS)).toBe("goal");
    expect(resolvePenalty(kick("center", "placed"), save("right", "dive_early"), NO_MISS)).toBe("goal");
  });

  test("centro + fuerte también arriesga el errado", () => {
    expect(resolvePenalty(kick("center", "strong"), save("left", "wait"), MISS)).toBe("missed");
  });

  test("la patada colocada nunca se erra", () => {
    expect(resolvePenalty(kick("left", "placed"), save("right", "wait"), MISS)).toBe("goal");
  });
});

describe("missRollFor — azar derivado del seed", () => {
  test("determinístico: mismo seed + ronda + pateador = mismo roll", () => {
    expect(missRollFor("seed-a", 1, P1)).toBe(missRollFor("seed-a", 1, P1));
  });

  test("en rango [0, 1)", () => {
    for (let round = 1; round <= 15; round++) {
      const roll = missRollFor("seed-x", round, P1);
      expect(roll).toBeGreaterThanOrEqual(0);
      expect(roll).toBeLessThan(1);
    }
  });

  test("varía entre rondas y pateadores (no re-rolleable pero no constante)", () => {
    const rolls = new Set<number>();
    for (let round = 1; round <= 10; round++) {
      rolls.add(missRollFor("seed-x", round, P1));
      rolls.add(missRollFor("seed-x", round, P2));
    }
    expect(rolls.size).toBeGreaterThan(10);
  });
});

describe("tanda completa", () => {
  test("se juega entera aunque esté matemáticamente decidida", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    // P1 convierte 4, P2 erra 4: decidido tras la ronda 4, pero sin outcome hasta la 5
    state = playRounds(state, regulation(4, 0).slice(0, 4));
    expect(penalesGame.getOutcome(state)).toBeNull();

    state = playRounds(state, regulation(4, 0).slice(4));
    const outcome = penalesGame.getOutcome(state);
    expect(outcome).not.toBeNull();
    expect(outcome!.winnerId).toBe(P1);
    expect(outcome!.scores).toEqual({ [P1]: 4, [P2]: 0 });
  });

  test("resultados por ronda disponibles para la revelación", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    state = playRounds(state, regulation(2, 1).slice(0, 3));
    const rounds = getRoundResults(state);
    expect(rounds).toHaveLength(3);
    expect(rounds[0].results[P1]).toBe("goal");
    expect(rounds[0].results[P2]).toBe("goal");
    expect(rounds[2].results[P1]).toBe("saved");
    expect(rounds[2].results[P2]).toBe("saved");
  });

  test("ronda incompleta (falta el rival) no se resuelve ni se revela", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    state = penalesGame.applyMove(state, P1, SURE_GOAL);
    expect(getRoundResults(state)).toHaveLength(0);
    expect(penalesGame.getOutcome(state)).toBeNull();
  });
});

describe("muerte súbita", () => {
  test("empate 5-5 → sin outcome, sigue en muerte súbita", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    state = playRounds(state, regulation(5, 5));
    expect(penalesGame.getOutcome(state)).toBeNull();
  });

  test("primer desnivel por ronda define al ganador", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    state = playRounds(state, regulation(5, 5));
    // ronda 6: ambos convierten → sigue
    state = playRounds(state, [{ p1: { kick: SURE_GOAL.kick, save: SURE_GOAL.save }, p2: { kick: SURE_GOAL.kick, save: SURE_GOAL.save } }]);
    expect(penalesGame.getOutcome(state)).toBeNull();
    // ronda 7: P1 convierte, P2 atajado → gana P1
    state = playRounds(state, [{ p1: { kick: SURE_GOAL.kick, save: SURE_SAVE.save }, p2: { kick: SURE_SAVE.kick, save: SURE_GOAL.save } }]);
    const outcome = penalesGame.getOutcome(state);
    expect(outcome!.winnerId).toBe(P1);
    expect(outcome!.scores).toEqual({ [P1]: 7, [P2]: 6 });
  });

  test("tras suddenDeathMaxRounds sin desnivel gana quien más atajó", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    state = playRounds(state, regulation(5, 5));
    // P2 le ataja a P1 y P1 no ataja (gol de P2): 0-0 en desnivel por ronda... no —
    // ambos no convierten en cada ronda: P1 atajado, P2 gol? eso es desnivel.
    // Para empatar cada ronda sin goles: ambos atajados → P1 y P2 suman atajadas por igual.
    // Para desempatar por atajadas: P1 ataja (P2 erra fuerte no sirve sin seed)…
    // Ronda pareja SIN desnivel donde solo P1 ataja: P2 convierte y P1 convierte no cambia atajadas.
    // Usamos: ambos convierten (sin atajadas) las primeras N-1, y en TODAS P1 igual no puede sumar…
    // → construimos: cada ronda ambos son atajados (misma cantidad de atajadas para ambos), empate persistente.
    for (let i = 0; i < PENALES_CONFIG.suddenDeathMaxRounds; i++) {
      state = playRounds(state, [{ p1: SURE_SAVE, p2: SURE_SAVE }]);
    }
    const outcome = penalesGame.getOutcome(state);
    // mismas atajadas para ambos → empate
    expect(outcome).not.toBeNull();
    expect(outcome!.winnerId).toBeNull();
  });

  test("desempate por atajadas cuando la muerte súbita se agota", () => {
    // Sin errados, goles empatados ⇒ atajadas empatadas; el desnivel de atajadas
    // solo aparece vía un errado (fuerte). Seed donde P1 erra su fuerte en ronda 6:
    // P2 no suma atajada por ese errado, pero P1 sí ataja la colocada de P2.
    const seed = findSeed((s) => missRollFor(s, 6, P1) < PENALES_CONFIG.pMissStrong && missRollFor(s, 6, P2) >= PENALES_CONFIG.pMissStrong);
    let st = penalesGame.initialState([P1, P2], seed);
    st = playRounds(st, regulation(5, 5));
    // Ronda 6: P1 patea fuerte adivinada con timing esperar (gol si no erra) → erra por seed ⇒ "missed".
    // P2 patea colocada y P1 la ataja ⇒ ronda 6: P1 no convierte, P2 no convierte (atajada de P1). Sin desnivel de goles.
    st = playRounds(st, [
      { p1: { kick: kick("left", "strong"), save: save("left", "wait") }, p2: { kick: SURE_SAVE.kick, save: save("left", "wait") } },
    ]);
    expect(penalesGame.getOutcome(st)).toBeNull();
    // Rondas 7..fin: atajadas mutuas (sin goles, sin desnivel)
    for (let i = 1; i < PENALES_CONFIG.suddenDeathMaxRounds; i++) {
      st = playRounds(st, [{ p1: SURE_SAVE, p2: SURE_SAVE }]);
    }
    const outcome = penalesGame.getOutcome(st);
    expect(outcome).not.toBeNull();
    // P1 atajó una más (la colocada de P2 en ronda 6); el errado de P1 no cuenta como atajada de P2
    expect(outcome!.winnerId).toBe(P1);
  });
});

describe("determinismo", () => {
  test("mismo seed + mismos movimientos = mismo resultado, siempre", () => {
    const rounds = [
      ...regulation(3, 3),
      { p1: { kick: kick("right", "strong"), save: save("center", "dive_early") }, p2: { kick: kick("center", "strong"), save: save("right", "wait") } },
    ];
    const run = () => {
      let s = penalesGame.initialState([P1, P2], "seed-determinismo");
      s = playRounds(s, rounds);
      return { outcome: penalesGame.getOutcome(s), rounds: getRoundResults(s) };
    };
    expect(run()).toEqual(run());
  });
});

describe("validateMove", () => {
  const valid: RoundMove = SURE_GOAL;

  test("acepta un movimiento válido en la ronda que corresponde", () => {
    const state = penalesGame.initialState([P1, P2], "seed");
    expect(penalesGame.validateMove(state, P1, valid)).toBe(true);
  });

  test("rechaza jugador que no es de la partida", () => {
    const state = penalesGame.initialState([P1, P2], "seed");
    expect(penalesGame.validateMove(state, "intruso", valid)).toBe(false);
  });

  test("rechaza dirección inexistente", () => {
    const state = penalesGame.initialState([P1, P2], "seed");
    const bad = { kick: { direction: "arriba", power: "placed" }, save: valid.save } as unknown as RoundMove;
    expect(penalesGame.validateMove(state, P1, bad)).toBe(false);
  });

  test("rechaza potencia/timing inexistentes", () => {
    const state = penalesGame.initialState([P1, P2], "seed");
    const badPower = { kick: { direction: "left", power: "laser" }, save: valid.save } as unknown as RoundMove;
    const badTiming = { kick: valid.kick, save: { direction: "left", timing: "teleport" } } as unknown as RoundMove;
    expect(penalesGame.validateMove(state, P1, badPower)).toBe(false);
    expect(penalesGame.validateMove(state, P1, badTiming)).toBe(false);
  });

  test("rechaza más movimientos que rondas de regulación pendientes (ronda repetida)", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    for (let i = 0; i < PENALES_CONFIG.rounds; i++) {
      expect(penalesGame.validateMove(state, P1, valid)).toBe(true);
      state = penalesGame.applyMove(state, P1, valid);
    }
    // P1 ya commiteó sus 5 rondas; la 6 (muerte súbita) no existe hasta que P2 complete y haya empate
    expect(penalesGame.validateMove(state, P1, valid)).toBe(false);
  });

  test("permite la ronda de muerte súbita solo cuando hay empate 5-5", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    state = playRounds(state, regulation(5, 5));
    expect(penalesGame.getOutcome(state)).toBeNull();
    expect(penalesGame.validateMove(state, P1, valid)).toBe(true);
  });

  test("rechaza movimientos con la partida terminada", () => {
    let state = penalesGame.initialState([P1, P2], "seed");
    state = playRounds(state, regulation(3, 1));
    expect(penalesGame.getOutcome(state)).not.toBeNull();
    expect(penalesGame.validateMove(state, P1, valid)).toBe(false);
  });
});

/** Busca un seed que cumpla el predicado (determinístico: siempre encuentra el mismo). */
function findSeed(predicate: (seed: string) => boolean): string {
  for (let i = 0; i < 10_000; i++) {
    const seed = `seed-${i}`;
    if (predicate(seed)) return seed;
  }
  throw new Error("no seed found");
}
