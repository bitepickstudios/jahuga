"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { definition, type RoundMove } from "@/games/penales/definition";
import { buildState } from "./state";
import type { Match, MatchMoveRow } from "./types";

export interface ChallengeFormState {
  error: string | null;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function challengeUser(
  _prev: ChallengeFormState,
  formData: FormData,
): Promise<ChallengeFormState> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida. Iniciá sesión de nuevo." };

  const nickname = String(formData.get("nickname") ?? "").trim().toLowerCase().replace(/^@/, "");
  const mode = String(formData.get("mode") ?? "live");
  const amount = Number(formData.get("amount") ?? 0);
  if (!nickname) return { error: "Escribí el nickname del rival." };
  if (mode !== "live" && mode !== "async") return { error: "Modo inválido." };
  if (!Number.isInteger(amount) || amount < 0) return { error: "Monto de apuesta inválido." };

  const admin = createAdminClient();
  const { data: rival } = await admin
    .from("profiles")
    .select("id, nickname")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (!rival) return { error: `No existe nadie con el nickname @${nickname}.` };
  if (rival.id === user.id) return { error: "No podés retarte a vos mismo (todavía)." };

  if (amount > 0) {
    const supabase = await createClient();
    const { data: wallet } = await supabase.from("wallets").select("balance").maybeSingle();
    if (!wallet || Number(wallet.balance) < amount) {
      return { error: "No te alcanzan las Coins para esa apuesta." };
    }
  }

  const { data: match, error } = await admin
    .from("matches")
    .insert({
      game_id: "penales",
      challenger_id: user.id,
      opponent_id: rival.id,
      mode,
    })
    .select("id")
    .single();
  if (error || !match) return { error: "No se pudo crear el reto. Probá de nuevo." };

  if (amount > 0) {
    const { error: wagerError } = await admin
      .from("wagers")
      .insert({ match_id: match.id, amount });
    if (wagerError) {
      await admin.from("matches").delete().eq("id", match.id);
      return { error: "No se pudo crear la apuesta. Probá de nuevo." };
    }
  }

  redirect(`/play/${match.id}`);
}

export async function respondChallenge(
  matchId: string,
  accept: boolean,
): Promise<{ error: string | null }> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const admin = createAdminClient();
  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).maybeSingle();
  if (!match || match.opponent_id !== user.id) return { error: "Este reto no es para vos." };
  if (match.status !== "pending") return { error: "Este reto ya no está pendiente." };

  if (accept) {
    // Escrow primero (idempotente; no-op si es amistoso). Si a alguien no le
    // alcanzan las Coins, el check de wallets corta acá y el reto sigue pendiente.
    const { error: escrowError } = await admin.rpc("fn_escrow_wager", { p_match: matchId });
    if (escrowError) {
      return { error: "A alguno de los dos no le alcanzan las Coins para la apuesta." };
    }
  }

  const { data: updated, error } = await admin
    .from("matches")
    .update(
      accept
        ? { status: "active", accepted_at: new Date().toISOString() }
        : { status: "declined" },
    )
    .eq("id", matchId)
    .eq("status", "pending")
    .select("id");
  if (error) return { error: "No se pudo responder el reto." };
  if (accept && !updated?.length) {
    // Carrera rara (se rechazó/expiró entre medio): devolver el escrow
    await admin.rpc("fn_refund_wager", { p_match: matchId });
    return { error: "El reto ya no estaba pendiente." };
  }
  if (!accept) {
    await admin.rpc("fn_refund_wager", { p_match: matchId }); // no-op si nada escrowado
  }

  revalidatePath(`/play/${matchId}`);
  revalidatePath("/");
  return { error: null };
}

export async function commitMove(
  matchId: string,
  move: RoundMove,
): Promise<{ error: string | null }> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const admin = createAdminClient();
  const { data: match } = (await admin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle()) as { data: Match | null };
  if (!match || (match.challenger_id !== user.id && match.opponent_id !== user.id)) {
    return { error: "No sos parte de esta partida." };
  }
  if (match.status !== "active") return { error: "La partida no está activa." };

  const { data: moves } = (await admin
    .from("match_moves")
    .select("*")
    .eq("match_id", matchId)) as { data: MatchMoveRow[] | null };

  const state = buildState(match, moves ?? []);
  if (!definition.validateMove(state, user.id, move)) {
    return { error: "Movimiento inválido para esta ronda." };
  }

  const round = state.moves[user.id].length + 1;
  const { error: insertError } = await admin.from("match_moves").insert({
    match_id: matchId,
    player_id: user.id,
    round,
    move,
  });
  if (insertError) return { error: "Ya commiteaste esta ronda." };

  // ¿Terminó? El server es la única autoridad de resolución.
  const nextState = definition.applyMove(state, user.id, move);
  const outcome = definition.getOutcome(nextState);
  if (outcome) {
    await admin
      .from("matches")
      .update({
        status: "resolved",
        winner_id: outcome.winnerId,
        scores: outcome.scores,
        state: nextState,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .eq("status", "active");
    // Payout del pozo en la misma resolución (no-op si es amistosa)
    if (outcome.winnerId) {
      await admin.rpc("fn_settle_wager", { p_match: matchId, p_winner: outcome.winnerId });
    } else {
      await admin.rpc("fn_refund_wager", { p_match: matchId }); // empate: se devuelve
    }
    // Misiones del día (F6): jugar cuenta para ambos, ganar para el ganador
    for (const player of [match.challenger_id, match.opponent_id]) {
      if (player) await admin.rpc("fn_mission_event", { p_profile: player, p_event: "play_matches" });
    }
    if (outcome.winnerId) {
      await admin.rpc("fn_mission_event", { p_profile: outcome.winnerId, p_event: "win_matches" });
      const { data: wager } = await admin.from("wagers").select("amount").eq("match_id", matchId).maybeSingle();
      if (wager) {
        await admin.rpc("fn_mission_event", { p_profile: outcome.winnerId, p_event: "win_wagered" });
      }
    }
    await admin.rpc("refresh_profile_stats");
  }

  return { error: null };
}

/**
 * Snapshot de la partida para el cliente, vía RLS del usuario:
 * el rival solo aparece en rondas reveladas (D3).
 */
export async function getMatchSnapshot(matchId: string): Promise<{
  match: Match | null;
  moves: MatchMoveRow[];
  wagerAmount: number | null;
}> {
  const supabase = await createClient();
  const [{ data: match }, { data: moves }, { data: wager }] = await Promise.all([
    supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
    supabase.from("match_moves").select("*").eq("match_id", matchId),
    supabase.from("wagers").select("amount").eq("match_id", matchId).maybeSingle(),
  ]);
  return {
    match: match as Match | null,
    moves: (moves ?? []) as MatchMoveRow[],
    wagerAmount: wager ? Number(wager.amount) : null,
  };
}

/** Revancha: nuevo reto contra el mismo rival, mismo modo. */
export async function rematch(matchId: string): Promise<{ error: string | null; newMatchId?: string }> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const admin = createAdminClient();
  const { data: match } = await admin
    .from("matches")
    .select("challenger_id, opponent_id, mode, status")
    .eq("id", matchId)
    .maybeSingle();
  if (!match || (match.challenger_id !== user.id && match.opponent_id !== user.id)) {
    return { error: "No sos parte de esta partida." };
  }
  if (match.status !== "resolved") return { error: "La partida todavía no terminó." };

  const rivalId = match.challenger_id === user.id ? match.opponent_id : match.challenger_id;
  const { data: created, error } = await admin
    .from("matches")
    .insert({
      game_id: "penales",
      challenger_id: user.id,
      opponent_id: rivalId,
      mode: match.mode,
    })
    .select("id")
    .single();
  if (error || !created) return { error: "No se pudo crear la revancha." };

  // La revancha repite la apuesta original (si había)
  const { data: wager } = await admin.from("wagers").select("amount").eq("match_id", matchId).maybeSingle();
  if (wager) {
    await admin.from("wagers").insert({ match_id: created.id, amount: wager.amount });
  }
  return { error: null, newMatchId: created.id };
}
