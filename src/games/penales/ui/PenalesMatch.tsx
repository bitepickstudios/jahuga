"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { MotionConfig } from "framer-motion";
import {
  PENALES_CONFIG,
  type PenalesState,
  type RoundMove,
  getRoundResults,
  penalesGame,
} from "../engine";
import { botMove } from "../bot";
import { PenaltyReveal } from "./PenaltyReveal";
import { Scoreboard } from "./Scoreboard";
import { EMPTY_DRAFT, PickRound, type Draft } from "./PickRound";

type Mode = "bot" | "two_players";

type Screen =
  | { kind: "setup" }
  | { kind: "handoff"; player: 0 | 1 }
  | { kind: "pick"; player: 0 | 1 }
  | { kind: "reveal"; round: number; shooter: 0 | 1 }
  | { kind: "result" };

const PLAYER_IDS: [string, string] = ["p1", "p2"];

function newMatch(seed?: string): PenalesState {
  return penalesGame.initialState(PLAYER_IDS, seed ?? crypto.randomUUID());
}

export function PenalesMatch() {
  const [mode, setMode] = useState<Mode>("bot");
  const [state, setState] = useState<PenalesState>(() => newMatch("setup"));
  const [screen, setScreen] = useState<Screen>({ kind: "setup" });
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const names: [string, string] = mode === "bot" ? ["Vos", "La Máquina"] : ["Jugador 1", "Jugador 2"];
  const rounds = getRoundResults(state);
  const outcome = penalesGame.getOutcome(state);
  const currentRound = Math.min(state.moves[PLAYER_IDS[0]].length, state.moves[PLAYER_IDS[1]].length) + 1;
  const inSuddenDeath = currentRound > PENALES_CONFIG.rounds;

  const results: [("goal" | "saved" | "missed")[], ("goal" | "saved" | "missed")[]] = [
    rounds.map((r) => r.results[PLAYER_IDS[0]]),
    rounds.map((r) => r.results[PLAYER_IDS[1]]),
  ];
  const scores: [number, number] = [
    results[0].filter((r) => r === "goal").length,
    results[1].filter((r) => r === "goal").length,
  ];

  function start(selectedMode: Mode) {
    setMode(selectedMode);
    setState(newMatch());
    setDraft(EMPTY_DRAFT);
    setScreen(selectedMode === "bot" ? { kind: "pick", player: 0 } : { kind: "handoff", player: 0 });
  }

  function confirmDraft(player: 0 | 1) {
    const move: RoundMove = {
      kick: { direction: draft.kickDirection!, power: draft.power },
      save: { direction: draft.saveDirection!, timing: draft.timing },
    };
    let next = penalesGame.applyMove(state, PLAYER_IDS[player], move);
    setDraft(EMPTY_DRAFT);

    if (mode === "bot") {
      next = penalesGame.applyMove(next, PLAYER_IDS[1], botMove());
      setState(next);
      setScreen({ kind: "reveal", round: getRoundResults(next).length, shooter: 0 });
      return;
    }

    setState(next);
    if (player === 0) {
      setScreen({ kind: "handoff", player: 1 });
    } else {
      setScreen({ kind: "reveal", round: getRoundResults(next).length, shooter: 0 });
    }
  }

  function advanceReveal(round: number, shooter: 0 | 1) {
    if (shooter === 0) {
      setScreen({ kind: "reveal", round, shooter: 1 });
      return;
    }
    if (penalesGame.getOutcome(state) !== null) {
      setScreen({ kind: "result" });
      return;
    }
    setScreen(mode === "bot" ? { kind: "pick", player: 0 } : { kind: "handoff", player: 0 });
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-6 px-5 py-8">
        {screen.kind === "setup" && (
          <>
            <header className="mt-8 text-center">
              <p className="text-sm uppercase tracking-widest text-chalk/50">Lobby presenta</p>
              <h1 className="font-display text-5xl uppercase text-chalk">Tanda de Penales</h1>
              <p className="mt-3 text-chalk/60">
                Cinco penales por lado. Leé al rival: no hay reflejos, hay psicología.
              </p>
            </header>
            <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
              <Button variant="primary" size="lg" fullWidth className="min-h-12" onPress={() => start("bot")}>
                Jugar vs la máquina
              </Button>
              <Button variant="secondary" size="lg" fullWidth className="min-h-12" onPress={() => start("two_players")}>
                2 jugadores · pasá el teléfono
              </Button>
            </div>
          </>
        )}

        {screen.kind !== "setup" && (
          <div className="flex w-full flex-col items-center gap-2">
            <Scoreboard names={names} results={results} scores={scores} />
            {inSuddenDeath && outcome === null && (
              <p className="font-display text-lg uppercase tracking-wide text-albirroja">Muerte súbita</p>
            )}
          </div>
        )}

        {screen.kind === "handoff" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <p className="text-4xl">🤫</p>
            <h2 className="font-display text-3xl uppercase text-chalk">
              Pasale el teléfono a {names[screen.player]}
            </h2>
            <p className="max-w-xs text-chalk/60">
              {names[screen.player === 0 ? 1 : 0]}: nada de mirar. La gracia es no saber.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="min-h-12 w-full max-w-sm"
              onPress={() => setScreen({ kind: "pick", player: screen.player })}
            >
              Soy {names[screen.player]}, listo
            </Button>
          </div>
        )}

        {screen.kind === "pick" && (
          <PickRound
            key={`${currentRound}-${screen.player}`}
            playerName={names[screen.player]}
            round={currentRound}
            draft={draft}
            onChange={setDraft}
            onConfirm={() => confirmDraft(screen.player)}
          />
        )}

        {screen.kind === "reveal" &&
          (() => {
            const roundResult = rounds[screen.round - 1];
            const shooterId = PLAYER_IDS[screen.shooter];
            const keeper = screen.shooter === 0 ? 1 : 0;
            return (
              <PenaltyReveal
                key={`${screen.round}-${screen.shooter}`}
                kickerName={names[screen.shooter]}
                kick={state.moves[shooterId][screen.round - 1].kick}
                save={state.moves[PLAYER_IDS[keeper]][screen.round - 1].save}
                result={roundResult.results[shooterId]}
                onDone={() => advanceReveal(screen.round, screen.shooter)}
              />
            );
          })()}

        {screen.kind === "result" && outcome && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <h2 className="font-display text-5xl uppercase text-chalk">
              {outcome.winnerId === null
                ? "Empate"
                : mode === "bot" && outcome.winnerId === PLAYER_IDS[0]
                  ? "¡Ganaste!"
                  : `Ganó ${names[PLAYER_IDS.indexOf(outcome.winnerId) as 0 | 1]}`}
            </h2>
            <p className="font-display text-7xl text-chalk">
              {outcome.scores[PLAYER_IDS[0]]} – {outcome.scores[PLAYER_IDS[1]]}
            </p>
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Button variant="primary" size="lg" fullWidth className="min-h-12" onPress={() => start(mode)}>
                Revancha
              </Button>
              <Button variant="ghost" size="lg" fullWidth className="min-h-12" onPress={() => setScreen({ kind: "setup" })}>
                Cambiar modo
              </Button>
            </div>
          </div>
        )}
      </main>
    </MotionConfig>
  );
}
