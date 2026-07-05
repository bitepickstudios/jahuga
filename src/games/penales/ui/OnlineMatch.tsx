"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MotionConfig } from "framer-motion";
import {
  PENALES_CONFIG,
  getRoundResults,
  penalesGame,
  type PenaltyResult,
  type RoundMove,
} from "../engine";
import { useMatchChannel } from "@/games/sdk/client";
import { PenaltyReveal } from "./PenaltyReveal";
import { Scoreboard } from "./Scoreboard";
import { EMPTY_DRAFT, PickRound, type Draft } from "./PickRound";

/** Filas de movimientos visibles según RLS (propias + rondas reveladas). */
export interface MoveRow {
  player_id: string;
  round: number;
  move: RoundMove;
}

export interface MatchSnapshot {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  mode: "live" | "async";
  status: string;
  seed: string;
  winner_id: string | null;
  scores: Record<string, number> | null;
}

export interface PlayerInfo {
  nickname: string;
  display_name: string | null;
}

/** Actions de plataforma inyectadas por el shell (games/* no importa features/*). */
export interface MatchActions {
  snapshot: () => Promise<{ match: MatchSnapshot | null; moves: MoveRow[]; wagerAmount: number | null }>;
  commit: (move: RoundMove) => Promise<{ error: string | null }>;
  respond: (accept: boolean) => Promise<{ error: string | null }>;
  rematch: () => Promise<{ error: string | null; newMatchId?: string }>;
}

function coins(n: number): string {
  return n.toLocaleString("es-PY");
}

function buildVisibleState(match: MatchSnapshot, moves: MoveRow[]) {
  const players: [string, string] = [match.challenger_id, match.opponent_id!];
  let state = penalesGame.initialState(players, match.seed);
  for (const player of players) {
    const own = moves.filter((m) => m.player_id === player).sort((a, b) => a.round - b.round);
    for (const row of own) state = penalesGame.applyMove(state, player, row.move);
  }
  return state;
}

export function OnlineMatch({
  meId,
  players,
  initialMatch,
  initialMoves,
  initialWager = null,
  actions,
}: {
  meId: string;
  players: Record<string, PlayerInfo>;
  initialMatch: MatchSnapshot;
  initialMoves: MoveRow[];
  initialWager?: number | null;
  actions: MatchActions;
}) {
  const router = useRouter();
  const [match, setMatch] = useState(initialMatch);
  const [moves, setMoves] = useState(initialMoves);
  const [wager, setWager] = useState<number | null>(initialWager);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Penales ya mostrados en la revelación (persistido para no repetir al recargar)
  const [revealPointer, setRevealPointer] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(`lobby:reveal:${initialMatch.id}`) ?? 0);
  });

  const refresh = useCallback(async () => {
    const snap = await actions.snapshot();
    if (snap.match) setMatch(snap.match);
    setMoves(snap.moves);
    setWager(snap.wagerAmount);
  }, [actions]);

  useMatchChannel(match.id, refresh);

  useEffect(() => {
    localStorage.setItem(`lobby:reveal:${match.id}`, String(revealPointer));
  }, [match.id, revealPointer]);

  const rivalId = match.challenger_id === meId ? match.opponent_id! : match.challenger_id;
  const name = (id: string) => {
    const p = players[id];
    return p ? (p.display_name ?? `@${p.nickname}`) : "Rival";
  };

  const order: [string, string] = [match.challenger_id, match.opponent_id!];
  const state = buildVisibleState(match, moves);
  const revealed = getRoundResults(state); // solo rondas con ambos movimientos visibles
  const myMoves = moves.filter((m) => m.player_id === meId).length;
  const results: [PenaltyResult[], PenaltyResult[]] = [
    revealed.map((r) => r.results[order[0]]),
    revealed.map((r) => r.results[order[1]]),
  ];
  const scores: [number, number] = [
    results[0].filter((r) => r === "goal").length,
    results[1].filter((r) => r === "goal").length,
  ];

  const totalRevealedPenalties = revealed.length * 2;
  const pointer = Math.min(revealPointer, totalRevealedPenalties);
  const revealing = pointer < totalRevealedPenalties;
  const inSuddenDeath = revealed.length >= PENALES_CONFIG.rounds && match.status === "active";

  async function submitDraft() {
    setBusy(true);
    setError(null);
    const move: RoundMove = {
      kick: { direction: draft.kickDirection!, power: draft.power },
      save: { direction: draft.saveDirection!, timing: draft.timing },
    };
    const result = await actions.commit(move);
    if (result.error) setError(result.error);
    else setDraft(EMPTY_DRAFT);
    await refresh();
    setBusy(false);
  }

  async function respond(accept: boolean) {
    setBusy(true);
    setError(null);
    const result = await actions.respond(accept);
    if (result.error) setError(result.error);
    await refresh();
    setBusy(false);
  }

  async function startRematch() {
    setBusy(true);
    const result = await actions.rematch();
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push(`/play/${result.newMatchId}`);
  }

  // ── Pantallas según estado ──────────────────────────────

  let body: React.ReactNode = null;

  if (match.status === "pending") {
    body =
      match.opponent_id === meId ? (
        <CenterScreen emoji="⚔️" title={`${name(match.challenger_id)} te retó`}>
          <p className="text-ice/60">
            Tanda de penales · {match.mode === "live" ? "en vivo" : "cuando puedan"}
          </p>
          {wager !== null && (
            <p className="rounded-full border border-gold/40 bg-navy/80 px-4 py-1.5 font-ui text-sm font-bold text-gold">
              🪙 {coins(wager)} por cabeza — se descuentan al aceptar
            </p>
          )}
          <Button variant="primary" size="lg" fullWidth className="min-h-12 max-w-sm" isDisabled={busy} onPress={() => respond(true)}>
            Aceptar el reto
          </Button>
          <Button variant="ghost" size="lg" fullWidth className="min-h-12 max-w-sm" isDisabled={busy} onPress={() => respond(false)}>
            Rechazar
          </Button>
        </CenterScreen>
      ) : (
        <CenterScreen emoji="⏳" title={`Esperando a ${name(rivalId)}`}>
          <p className="text-ice/60">Le avisamos del reto. Podés cerrar esta pantalla y volver después.</p>
        </CenterScreen>
      );
  } else if (match.status === "declined") {
    body = (
      <CenterScreen emoji="🙅" title="Reto rechazado">
        <p className="text-ice/60">{name(rivalId)} no quiso jugar. Otra vez será.</p>
        <BackHome />
      </CenterScreen>
    );
  } else if (match.status === "expired" || match.status === "abandoned") {
    body = (
      <CenterScreen emoji="🕰️" title={match.status === "expired" ? "Reto vencido" : "Partida abandonada"}>
        {match.winner_id && <p className="text-ice/60">Ganó {name(match.winner_id)} por walkover.</p>}
        <BackHome />
      </CenterScreen>
    );
  } else if (revealing) {
    const round = Math.floor(pointer / 2) + 1;
    const shooterIdx = (pointer % 2) as 0 | 1;
    const shooterId = order[shooterIdx];
    const keeperId = order[shooterIdx === 0 ? 1 : 0];
    const shooterMove = moves.find((m) => m.player_id === shooterId && m.round === round)!;
    const keeperMove = moves.find((m) => m.player_id === keeperId && m.round === round)!;
    body = (
      <PenaltyReveal
        key={pointer}
        kickerName={shooterId === meId ? "vos" : name(shooterId)}
        kick={shooterMove.move.kick}
        save={keeperMove.move.save}
        result={revealed[round - 1].results[shooterId]}
        onDone={() => setRevealPointer(pointer + 1)}
      />
    );
  } else if (match.status === "resolved") {
    const iWon = match.winner_id === meId;
    body = (
      <CenterScreen
        emoji={match.winner_id === null ? "🤝" : iWon ? "🏆" : "😩"}
        title={match.winner_id === null ? "Empate" : iWon ? "¡Ganaste!" : `Ganó ${name(match.winner_id)}`}
      >
        {match.scores && (
          <p className="font-display text-6xl text-ice">
            {match.scores[order[0]]} – {match.scores[order[1]]}
          </p>
        )}
        {wager !== null && (
          <p className={`font-ui text-xl font-extrabold ${match.winner_id === null ? "text-ice/60" : iWon ? "text-volt" : "text-danger"}`}>
            {match.winner_id === null
              ? "Apuesta devuelta"
              : iWon
                ? `+${coins(wager)} Coins`
                : `−${coins(wager)} Coins`}
          </p>
        )}
        <Button variant="primary" size="lg" fullWidth className="min-h-12 max-w-sm" isDisabled={busy} onPress={startRematch}>
          Revancha
        </Button>
        <BackHome />
      </CenterScreen>
    );
  } else if (myMoves === revealed.length) {
    // Me toca elegir la ronda actual
    body = (
      <PickRound
        key={myMoves + 1}
        playerName="vos"
        round={myMoves + 1}
        draft={draft}
        onChange={setDraft}
        onConfirm={submitDraft}
        confirmDisabled={busy}
      />
    );
  } else {
    body = (
      <CenterScreen emoji="🧠" title={`${name(rivalId)} está pensando`}>
        <p className="text-ice/60">
          {match.mode === "async"
            ? "Podés cerrar y volver cuando juegue: te va a estar esperando."
            : "En cuanto elija, se revela el penal."}
        </p>
      </CenterScreen>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-pitch-game min-h-dvh"><div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-6 px-5 py-8">
        {match.status !== "pending" && match.status !== "declined" && (
          <div className="flex w-full flex-col items-center gap-2">
            <Scoreboard
              names={[
                order[0] === meId ? "Vos" : name(order[0]),
                order[1] === meId ? "Vos" : name(order[1]),
              ]}
              results={results}
              scores={scores}
            />
            {wager !== null && match.status === "active" && (
              <p className="rounded-full bg-navy/80 px-3 py-1 font-ui text-xs font-bold text-gold">
                Pozo: 🪙 {coins(wager * 2)}
              </p>
            )}
            {inSuddenDeath && (
              <p className="font-display text-lg uppercase tracking-wide text-danger">Muerte súbita</p>
            )}
          </div>
        )}
        {body}
        {error && <p className="text-center text-sm text-danger">{error}</p>}
      </div>
      </main>
    </MotionConfig>
  );
}

function CenterScreen({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <p className="text-5xl">{emoji}</p>
      <h2 className="font-display text-3xl uppercase text-ice">{title}</h2>
      {children}
    </div>
  );
}

function BackHome() {
  return (
    <Link href="/" className="text-sm text-ice/60 underline underline-offset-4">
      Volver al lobby
    </Link>
  );
}
