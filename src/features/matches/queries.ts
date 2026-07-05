import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PENALES_CONFIG } from "@/games/penales/definition";
import type { Match, MatchMode, MatchMoveRow, MatchPlayer, MatchStatus } from "./types";

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

/** Retos pendientes recibidos por el usuario actual (con apuesta si hay). */
export async function getPendingChallenges(): Promise<
  (Match & { challenger: MatchPlayer; wager_amount: number | null })[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: matches } = await supabase
    .from("matches")
    .select("*, wagers(amount)")
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
  return (matches as (Match & { wagers: { amount: number } | null })[]).map((m) => ({
    ...m,
    challenger: byId[m.challenger_id],
    wager_amount: m.wagers ? Number(m.wagers.amount) : null,
  }));
}

export interface OpenMatch {
  id: string;
  rival: MatchPlayer | null;
  mode: MatchMode;
  status: MatchStatus; // "pending" | "active"
  role: "challenger" | "opponent";
  yourTurn: boolean; // activa y con movimientos pendientes de tu lado
  wager_amount: number | null;
}

/**
 * Partidas abiertas del usuario (pendientes + activas, vs humano) para poder
 * retomarlas. Las de "te toca" van primero. Los conteos de movimientos se leen
 * con admin (el usuario es participante verificado de estas partidas).
 */
export async function getOpenMatches(): Promise<OpenMatch[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("*, wagers(amount)")
    .in("status", ["pending", "active"])
    .eq("is_vs_bot", false)
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  if (!matches?.length) return [];

  const admin = createAdminClient();
  const ids = (matches as Match[]).map((m) => m.id);
  const rivalIds = (matches as Match[])
    .map((m) => (m.challenger_id === user.id ? m.opponent_id : m.challenger_id))
    .filter(Boolean) as string[];

  const [{ data: moves }, { data: profiles }] = await Promise.all([
    admin.from("match_moves").select("match_id, player_id").in("match_id", ids),
    admin.from("profiles").select("id, nickname, display_name, photo_url").in("id", rivalIds),
  ]);

  const count: Record<string, number> = {};
  for (const mv of moves ?? []) {
    const k = `${mv.match_id}:${mv.player_id}`;
    count[k] = (count[k] ?? 0) + 1;
  }
  const byId = Object.fromEntries(((profiles ?? []) as MatchPlayer[]).map((p) => [p.id, p]));

  return (matches as (Match & { wagers: { amount: number } | null })[])
    .map((m) => {
      const rivalId = m.challenger_id === user.id ? m.opponent_id : m.challenger_id;
      const mine = count[`${m.id}:${user.id}`] ?? 0;
      const theirs = rivalId ? (count[`${m.id}:${rivalId}`] ?? 0) : 0;
      // Async: podés commitear si vas por detrás, o empatados y aún en regulación.
      const yourTurn =
        m.status === "active" && (mine < theirs || (mine === theirs && mine < PENALES_CONFIG.rounds));
      return {
        id: m.id,
        rival: rivalId ? (byId[rivalId] ?? null) : null,
        mode: m.mode,
        status: m.status,
        role: (m.challenger_id === user.id ? "challenger" : "opponent") as "challenger" | "opponent",
        yourTurn,
        wager_amount: m.wagers ? Number(m.wagers.amount) : null,
      };
    })
    .sort((a, b) => Number(b.yourTurn) - Number(a.yourTurn));
}

/** Monto apostado de una partida (vía RLS de participante), o null si es amistosa. */
export async function getWagerAmount(matchId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("wagers").select("amount").eq("match_id", matchId).maybeSingle();
  return data ? Number(data.amount) : null;
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
