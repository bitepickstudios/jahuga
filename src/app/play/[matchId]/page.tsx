import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { getMatch, getMatchPlayers, getVisibleMoves, getWagerAmount } from "@/features/matches/queries";
import { commitMove, getMatchSnapshot, rematch, respondChallenge } from "@/features/matches/actions";
import { OnlineMatch, type MatchSnapshot, type MoveRow } from "@/games/penales/ui/OnlineMatch";
import Link from "next/link";

export const metadata: Metadata = { title: "Partida — Jahuga" };

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  const match = await getMatch(matchId); // RLS: solo participantes
  if (!match || match.game_id !== "penales" || !match.opponent_id) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 px-5 py-24 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="font-ui text-2xl font-extrabold text-ice">Partida no encontrada</h1>
        <p className="text-ice/60">No existe o no sos parte de ella.</p>
        <Link href="/" className="text-volt underline underline-offset-4">
          Volver al lobby
        </Link>
      </main>
    );
  }

  const [players, moves, wagerAmount] = await Promise.all([
    getMatchPlayers(match),
    getVisibleMoves(matchId),
    getWagerAmount(matchId),
  ]);

  return (
    <OnlineMatch
      meId={profile.id}
      players={players}
      initialMatch={match as MatchSnapshot}
      initialMoves={moves as MoveRow[]}
      initialWager={wagerAmount}
      actions={{
        snapshot: getMatchSnapshot.bind(null, matchId) as () => Promise<{
          match: MatchSnapshot | null;
          moves: MoveRow[];
          wagerAmount: number | null;
        }>,
        commit: commitMove.bind(null, matchId),
        respond: respondChallenge.bind(null, matchId),
        rematch: rematch.bind(null, matchId),
      }}
    />
  );
}
