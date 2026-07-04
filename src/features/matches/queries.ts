import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Match, MatchMoveRow, MatchPlayer } from "./types";

/** Partida vía RLS (solo participantes la ven). */
export async function getMatch(matchId: string): Promise<Match | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
  return data as Match | null;
}

/** Movimientos visibles para el viewer según RLS (propios + revelados). */
export async function getVisibleMoves(matchId: string): Promise<MatchMoveRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("match_moves").select("*").eq("match_id", matchId);
  return (data ?? []) as MatchMoveRow[];
}

/**
 * Datos mínimos de los jugadores de una partida. Va con admin porque un
 * participante tiene derecho a ver nickname/foto de su rival aunque el
 * perfil sea privado — el llamador DEBE haber verificado participación.
 */
export async function getMatchPlayers(match: Match): Promise<Record<string, MatchPlayer>> {
  const admin = createAdminClient();
  const ids = [match.challenger_id, match.opponent_id].filter(Boolean) as string[];
  const { data } = await admin
    .from("profiles")
    .select("id, nickname, display_name, photo_url")
    .in("id", ids);
  return Object.fromEntries(((data ?? []) as MatchPlayer[]).map((p) => [p.id, p]));
}

/** Retos pendientes recibidos por el usuario actual. */
export async function getPendingChallenges(): Promise<(Match & { challenger: MatchPlayer })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("opponent_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (!matches?.length) return [];

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nickname, display_name, photo_url")
    .in("id", matches.map((m) => m.challenger_id));
  const byId = Object.fromEntries(((profiles ?? []) as MatchPlayer[]).map((p) => [p.id, p]));
  return (matches as Match[]).map((m) => ({ ...m, challenger: byId[m.challenger_id] }));
}

export interface ProfileStats {
  profile_id: string;
  game_id: string;
  played: number;
  won: number;
}

export async function getProfileStats(profileId: string): Promise<ProfileStats[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile_stats").select("*").eq("profile_id", profileId);
  return (data ?? []) as ProfileStats[];
}

/** Historial propio (RLS: solo se ven las partidas donde participás). */
export async function getOwnMatchHistory(limit = 20): Promise<(Match & { rival: MatchPlayer | null })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "resolved")
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order("resolved_at", { ascending: false })
    .limit(limit);
  if (!matches?.length) return [];

  const admin = createAdminClient();
  const rivalIds = (matches as Match[]).map((m) =>
    m.challenger_id === user.id ? m.opponent_id : m.challenger_id,
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nickname, display_name, photo_url")
    .in("id", rivalIds.filter(Boolean) as string[]);
  const byId = Object.fromEntries(((profiles ?? []) as MatchPlayer[]).map((p) => [p.id, p]));
  return (matches as Match[]).map((m) => ({
    ...m,
    rival: byId[(m.challenger_id === user.id ? m.opponent_id : m.challenger_id) ?? ""] ?? null,
  }));
}
