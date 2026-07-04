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
  if (!nickname) return { error: "Escribí el nickname del rival." };
  if (mode !== "live" && mode !== "async") return { error: "Modo inválido." };

  const admin = createAdminClient();
  const { data: rival } = await admin
    .from("profiles")
    .select("id, nickname")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (!rival) return { error: `No existe nadie con el nickname @${nickname}.` };
  if (rival.id === user.id) return { error: "No podés retarte a vos mismo (todavía)." };

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

  const { error } = await admin
    .from("matches")
    .update(
      accept
        ? { status: "active", accepted_at: new Date().toISOString() }
        : { status: "declined" },
    )
    .eq("id", matchId)
    .eq("status", "pending");
  if (error) return { error: "No se pudo responder el reto." };

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
}> {
  const supabase = await createClient();
  const [{ data: match }, { data: moves }] = await Promise.all([
    supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
    supabase.from("match_moves").select("*").eq("match_id", matchId),
  ]);
  return { match: match as Match | null, moves: (moves ?? []) as MatchMoveRow[] };
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
  return { error: null, newMatchId: created.id };
}
