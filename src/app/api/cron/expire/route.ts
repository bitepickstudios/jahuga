import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const HOURS_48 = 48 * 60 * 60 * 1000;

/**
 * Expiración según spec minijuego-penales.md §7:
 * - reto pendiente > 48 h → expired
 * - partida activa con un jugador inactivo > 48 h → abandoned, gana el rival (walkover)
 * Corre por Vercel Cron (vercel.json).
 */
export async function GET(request: NextRequest) {
  if (
    process.env.CRON_SECRET &&
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - HOURS_48).toISOString();

  const { data: expired } = await admin
    .from("matches")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  // Walkover: activas aceptadas hace > 48 h donde un jugador va atrasado y no movió desde el corte
  const { data: stale } = await admin
    .from("matches")
    .select("id, challenger_id, opponent_id, accepted_at")
    .eq("status", "active")
    .lt("accepted_at", cutoff);

  let abandoned = 0;
  for (const match of stale ?? []) {
    const { data: moves } = await admin
      .from("match_moves")
      .select("player_id, created_at")
      .eq("match_id", match.id);
    const players = [match.challenger_id, match.opponent_id] as string[];
    const lastMove = (p: string) =>
      (moves ?? [])
        .filter((m) => m.player_id === p)
        .reduce<string | null>((max, m) => (max && max > m.created_at ? max : m.created_at), null);
    const counts = players.map((p) => (moves ?? []).filter((m) => m.player_id === p).length);

    // Jugador atrasado (menos rondas) sin actividad desde el corte → pierde por walkover
    let loser: string | null = null;
    if (counts[0] !== counts[1]) {
      const behind = counts[0] < counts[1] ? 0 : 1;
      const last = lastMove(players[behind]) ?? match.accepted_at;
      if (last < cutoff) loser = players[behind];
    } else if ((lastMove(players[0]) ?? match.accepted_at) < cutoff && (lastMove(players[1]) ?? match.accepted_at) < cutoff) {
      // Ambos inactivos y empatados en rondas → abandonada sin ganador
      await admin.from("matches").update({ status: "abandoned" }).eq("id", match.id).eq("status", "active");
      abandoned++;
      continue;
    }
    if (loser) {
      const winner = players.find((p) => p !== loser)!;
      await admin
        .from("matches")
        .update({ status: "abandoned", winner_id: winner, resolved_at: new Date().toISOString() })
        .eq("id", match.id)
        .eq("status", "active");
      abandoned++;
    }
  }

  return NextResponse.json({ expired: expired?.length ?? 0, abandoned });
}
