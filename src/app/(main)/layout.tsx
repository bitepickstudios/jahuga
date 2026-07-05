import { getOwnProfile } from "@/features/profiles/queries";
import { getPendingChallenges } from "@/features/matches/queries";
import { getBalance } from "@/features/economy/queries";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

/** Shell de la app (header + bottom nav). /play/* y (auth) quedan inmersivos, sin shell. */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const profile = await getOwnProfile();
  const [challenges, balance] = profile
    ? await Promise.all([getPendingChallenges(), getBalance()])
    : [[], null];

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AppHeader
        profile={profile ? { nickname: profile.nickname, photo_url: profile.photo_url } : null}
        pendingCount={challenges.length}
        balance={balance}
      />
      {/* pt-16: el header es overlay absoluto; el contenido despeja los 64px */}
      <div className="flex flex-1 flex-col pt-16 pb-24 lg:pb-0">{children}</div>
      {profile && <BottomNav />}
    </div>
  );
}
