import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAvatar, getOwnProfile } from "@/features/profiles/queries";
import { getOwnMatchHistory, getProfileStats } from "@/features/matches/queries";
import { ProfileEditor, type HistoryEntry } from "./ProfileEditor";

export const metadata: Metadata = { title: "Mi perfil — Jahuga" };

export default async function PerfilPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");
  const [avatar, stats, matches] = await Promise.all([
    getAvatar(profile.id),
    getProfileStats(profile.id),
    getOwnMatchHistory(10),
  ]);

  const penales = stats.find((s) => s.game_id === "penales") ?? null;
  const history: HistoryEntry[] = matches.map((m) => ({
    id: m.id,
    rivalName: m.rival ? (m.rival.display_name ?? `@${m.rival.nickname}`) : "Rival",
    myScore: m.scores?.[profile.id] ?? 0,
    rivalScore: m.scores?.[m.challenger_id === profile.id ? (m.opponent_id ?? "") : m.challenger_id] ?? 0,
    result: m.winner_id === null ? "draw" : m.winner_id === profile.id ? "won" : "lost",
  }));

  return (
    <ProfileEditor
      profile={profile}
      avatar={avatar}
      stats={penales ? { played: penales.played, won: penales.won } : null}
      history={history}
    />
  );
}
