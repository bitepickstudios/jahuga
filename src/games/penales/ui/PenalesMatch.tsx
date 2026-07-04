"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { MotionConfig } from "framer-motion";
import {
  PENALES_CONFIG,
  type Direction,
  type KickPower,
  type PenalesState,
  type RoundMove,
  type SaveTiming,
  getRoundResults,
  penalesGame,
} from "../engine";
import { botMove } from "../bot";
import { GoalPicker } from "./GoalPicker";
import { PenaltyReveal } from "./PenaltyReveal";
import { Scoreboard } from "./Scoreboard";

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

/** Borrador del movimiento de la ronda mientras el jugador elige. */
interface Draft {
  kickDirection: Direction | null;
  power: KickPower;
  saveDirection: Direction | null;
  timing: SaveTiming;
}

const EMPTY_DRAFT: Draft = { kickDirection: null, power: "placed", saveDirection: null, timing: "wait" };

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

/** Selección de la ronda: primero pateás, después atajás. Todo con el pulgar. */
function PickRound({
  playerName,
  round,
  draft,
  onChange,
  onConfirm,
}: {
  playerName: string;
  round: number;
  draft: Draft;
  onChange: (draft: Draft) => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<"kick" | "save">("kick");

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-chalk/50">
          Penal {round} · {playerName}
        </p>
        <h2 className="font-display text-3xl uppercase text-chalk">
          {step === "kick" ? "¿Dónde pateás?" : "¿Dónde te tirás?"}
        </h2>
      </header>

      {step === "kick" ? (
        <>
          <GoalPicker
            selected={draft.kickDirection}
            onSelect={(d) => onChange({ ...draft, kickDirection: d })}
          />
          <OptionToggle
            options={[
              { value: "placed", label: "Colocado", hint: "seguro, pero te pueden leer" },
              { value: "strong", label: "Fuerte", hint: "imparable si espera, 15% de errarlo" },
            ]}
            selected={draft.power}
            onSelect={(power) => onChange({ ...draft, power: power as KickPower })}
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-12 max-w-sm"
            isDisabled={draft.kickDirection === null}
            onPress={() => setStep("save")}
          >
            Listo, ahora atajá
          </Button>
        </>
      ) : (
        <>
          <GoalPicker
            selected={draft.saveDirection}
            onSelect={(d) => onChange({ ...draft, saveDirection: d })}
          />
          <OptionToggle
            options={[
              { value: "wait", label: "Esperar", hint: "reaccionás a lo colocado" },
              { value: "dive_early", label: "Adelantarse", hint: "le ganás al fuerte, el centro te mata" },
            ]}
            selected={draft.timing}
            onSelect={(timing) => onChange({ ...draft, timing: timing as SaveTiming })}
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-12 max-w-sm"
            isDisabled={draft.saveDirection === null}
            onPress={onConfirm}
          >
            Confirmar ronda
          </Button>
        </>
      )}
    </div>
  );
}

function OptionToggle({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string; hint: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected === option.value}
          onClick={() => onSelect(option.value)}
          className={`min-h-16 rounded-md border px-3 py-2 text-left transition-colors ${
            selected === option.value
              ? "border-chalk bg-chalk/10"
              : "border-chalk/20 active:bg-chalk/5"
          }`}
        >
          <span className="block font-semibold text-chalk">{option.label}</span>
          <span className="block text-xs text-chalk/50">{option.hint}</span>
        </button>
      ))}
    </div>
  );
}
