import { describe, expect, test } from "vitest";
import { botMove } from "./bot";
import { penalesGame } from "./engine";

describe("bot nivel 1 — aleatorio", () => {
  test("siempre produce un movimiento válido", () => {
    const state = penalesGame.initialState(["human", "bot"], "seed");
    for (let i = 0; i < 200; i++) {
      expect(penalesGame.validateMove(state, "bot", botMove())).toBe(true);
    }
  });

  test("con rng inyectado es determinístico", () => {
    let calls = 0;
    const rng = () => [0.1, 0.6, 0.9, 0.3][calls++ % 4];
    const a = botMove(rng);
    calls = 0;
    const b = botMove(rng);
    expect(a).toEqual(b);
  });

  test("cubre las tres direcciones de patada", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(botMove().kick.direction);
    expect(seen).toEqual(new Set(["left", "center", "right"]));
  });
});
