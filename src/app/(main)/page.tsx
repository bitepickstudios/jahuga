import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Target } from "lucide-react";
import { getAvatar, getOwnProfile } from "@/features/profiles/queries";
import { getPendingChallenges } from "@/features/matches/queries";
import { getMyGroup } from "@/features/groups/queries";
import { checkinStreak } from "@/features/economy/actions";
import { formatCoins } from "@/features/economy/config";
import { getMissions } from "@/features/missions/queries";
import { AvatarStage } from "@/features/avatars/AvatarStage";
import { ChallengeCard } from "./ChallengeCard";
import { MissionList } from "./MissionList";
import { GroupCard } from "./GroupCard";
import { LobbyActions } from "./LobbyActions";
import { InstallHint } from "./InstallHint";

// ponytail: sin env de Supabase la app cae a la landing anónima.
const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export default async function Home() {
  const profile = hasSupabaseEnv ? await getOwnProfile() : null;
  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  if (!profile) return <AnonHome />;

  const [challenges, myGroup, avatar, streak, missions] = await Promise.all([
    getPendingChallenges(),
    getMyGroup(),
    getAvatar(profile.id),
    checkinStreak(), // idempotente por día; premia la vuelta diaria (D2)
    getMissions(),
  ]);
  const skinId = ((avatar?.equipped as Record<string, string | null>)?.skin as string) ?? "albirroja";

  const challengeCards = challenges.map((c) => (
    <ChallengeCard
      key={c.id}
      matchId={c.id}
      challengerName={c.challenger?.display_name ?? `@${c.challenger?.nickname}`}
      challengerPhoto={c.challenger?.photo_url ?? null}
      mode={c.mode}
      wagerAmount={c.wager_amount}
    />
  ));

  const groupCard = <GroupCard myGroup={myGroup} />;
  const missionsCard =
    missions.length > 0 ? (
      <section className="overflow-hidden rounded-2xl border border-ice/10 bg-gradient-to-b from-navy/85 to-navy/55 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-volt/15 text-volt">
            <Target size={17} />
          </span>
          <h2 className="font-ui text-base font-extrabold text-ice">Misiones de hoy</h2>
        </div>
        <MissionList missions={missions} />
      </section>
    ) : null;

  return (
    <main className="relative flex-1 lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
      {/* Fondo de estadio fijo: cubre todo el viewport, también detrás del header overlay */}
      <div className="bg-stadium pointer-events-none fixed inset-0 -z-10" />

      {streak && streak.reward > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-gold/40 bg-navy/90 px-4 py-1.5 font-ui text-sm font-bold text-gold">
          <Flame size={16} /> Día {streak.days} de racha: +{formatCoins(streak.reward)} Coins
        </div>
      )}

      {/* ── Desktop: 3 columnas alineadas a la base, entra en viewport ── */}
      <div className="mx-auto hidden h-[calc(100dvh-4rem)] w-full max-w-[1900px] grid-cols-[minmax(320px,1fr)_minmax(0,1.7fr)_minmax(320px,1fr)] items-end gap-10 px-16 pb-10 lg:grid">
        <aside className="flex flex-col gap-4">
          {groupCard}
          {missionsCard}
        </aside>

        <section className="flex flex-col items-center justify-end">
          <AvatarStage
            photoUrl={profile.photo_url}
            skinId={skinId}
            name={profile.display_name ?? `@${profile.nickname}`}
            className="w-[420px] max-w-full"
          />
        </section>

        <aside className="flex flex-col gap-3">
          {challengeCards}
          <LobbyActions />
        </aside>
      </div>

      {/* ── Mobile: stack con scroll ── */}
      <div className="flex flex-col gap-4 px-4 py-5 lg:hidden">
        {challengeCards}
        <AvatarStage
          photoUrl={profile.photo_url}
          skinId={skinId}
          name={profile.display_name ?? `@${profile.nickname}`}
          className="mx-auto mt-28 w-full max-w-[280px]"
        />
        {groupCard}
        {missionsCard}
        <LobbyActions />
        <div className="lg:hidden">
          <InstallHint />
        </div>
      </div>
    </main>
  );
}

function AnonHome() {
  return (
    <main className="bg-stadium -mb-24 flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Image src="/assets/logo.v2.svg" alt="Jahuga" width={280} height={71} priority />
      <p className="max-w-xs text-lg text-ice/70">
        Minijuegos entre amigos. Retá, apostá y ganá.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        {hasSupabaseEnv && (
          <>
            <Link
              href="/registro"
              className="flex min-h-14 items-center justify-center rounded-2xl bg-volt font-ui text-xl font-extrabold text-volt-ink shadow-[0_5px_0_rgba(0,0,0,0.4)] transition-transform active:translate-y-0.5 active:shadow-none"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="flex min-h-12 items-center justify-center rounded-xl border border-ice/15 bg-navy/80 px-6 font-ui font-bold text-ice active:bg-navy-raised/80"
            >
              Entrar
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
