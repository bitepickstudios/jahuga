import { getOwnProfile } from "@/features/profiles/queries";
import { getOpenMatches } from "@/features/matches/queries";
import { getBalance } from "@/features/economy/queries";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

/** Shell de la app (header + bottom nav). /play/* y (auth) quedan inmersivos, sin shell. */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const profile = await getOwnProfile();
  const [openMatches, balance] = profile
    ? await Promise.all([getOpenMatches(), getBalance()])
    : [[], null];
  // Badge de la campana: partidas que requieren tu acción (te toca + retos recibidos).
  const actionable = openMatches.filter(
    (m) => m.yourTurn || (m.status === "pending" && m.role === "opponent"),
  ).length;

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Sin sesión (landing) no se muestra el header: solo los CTAs de ingreso */}
      {profile && (
        <AppHeader
          profile={{ nickname: profile.nickname, photo_url: profile.photo_url }}
          pendingCount={actionable}
          balance={balance}
        />
      )}
      {/* pt-16 solo con header (overlay absoluto); sin sesión no hace falta */}
      <div className={`flex flex-1 flex-col pb-24 lg:pb-0 ${profile ? "pt-16" : ""}`}>{children}</div>
      {profile && <BottomNav />}
    </div>
  );
}
