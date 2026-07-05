import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { getPendingChallenges } from "@/features/matches/queries";
import { PlayerAvatar } from "@/features/avatars/PlayerAvatar";
import { ChallengeCard } from "./ChallengeCard";

// ponytail: sin env de Supabase la app cae a la landing anónima.
const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export default async function Home() {
  const profile = hasSupabaseEnv ? await getOwnProfile() : null;
  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  if (!profile) return <AnonHome />;

  const challenges = await getPendingChallenges();

  return (
    <main className="bg-stadium -mb-24 flex-1 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-5 lg:grid lg:grid-cols-[300px_1fr_340px] lg:items-start lg:gap-6">
        {/* Mi Grupo — llega en F4; la card ya marca el lugar */}
        <aside className="order-3 mt-6 lg:order-1 lg:mt-0">
          <Link
            href="/grupo"
            className="block rounded-2xl border border-ice/10 bg-navy/80 p-4 backdrop-blur active:bg-navy-raised/80"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-ui text-base font-extrabold text-ice">Mi Grupo</h2>
              <span className="text-ice/40">›</span>
            </div>
            <p className="mt-1 text-sm text-ice/50">
              Armá tu grupo de amigos y compitan entre todos.
            </p>
            <span className="mt-3 inline-block rounded-full bg-ice/10 px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-wide text-ice/70">
              Próximamente
            </span>
          </Link>
        </aside>

        {/* Escenario: el avatar en grande */}
        <section className="order-1 flex flex-col items-center lg:order-2">
          {challenges.length > 0 && (
            <div className="mb-4 w-full max-w-md lg:hidden">
              {challenges.map((c) => (
                <ChallengeCard
                  key={c.id}
                  matchId={c.id}
                  challengerName={c.challenger?.display_name ?? `@${c.challenger?.nickname}`}
                  challengerPhoto={c.challenger?.photo_url ?? null}
                  mode={c.mode}
                />
              ))}
            </div>
          )}

          <div className="relative flex flex-col items-center pt-2">
            <PlayerAvatar photoUrl={profile.photo_url} pose="idle" className="h-72 w-56 drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] lg:h-96 lg:w-72" />
            {/* Podio de luz */}
            <div className="pointer-events-none -mt-6 h-10 w-64 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(61,109,255,0.4),transparent_70%)] lg:w-80" />
          </div>
          <p className="mt-1 font-ui text-lg font-bold text-ice/80">
            {profile.display_name ?? `@${profile.nickname}`}
          </p>
        </section>

        {/* Acciones */}
        <aside className="order-2 mt-5 flex flex-col gap-3 lg:order-3 lg:mt-0">
          {challenges.length > 0 && (
            <div className="hidden lg:block">
              {challenges.map((c) => (
                <ChallengeCard
                  key={c.id}
                  matchId={c.id}
                  challengerName={c.challenger?.display_name ?? `@${c.challenger?.nickname}`}
                  challengerPhoto={c.challenger?.photo_url ?? null}
                  mode={c.mode}
                />
              ))}
            </div>
          )}

          <Link
            href="/jugar"
            className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-volt font-ui text-2xl font-extrabold text-volt-ink shadow-[0_5px_0_rgba(0,0,0,0.4)] transition-transform active:translate-y-0.5 active:shadow-none"
          >
            <PlaySolid /> Jugar
          </Link>
          <Link
            href="/jugar/retar"
            className="flex min-h-13 items-center justify-between rounded-xl border border-ice/15 bg-navy/80 px-5 py-3.5 font-ui text-lg font-bold text-ice backdrop-blur active:bg-navy-raised/80"
          >
            <span>🤝 Retar</span>
            <span className="text-ice/40">›</span>
          </Link>
          <Link
            href="/play/local"
            className="flex min-h-13 items-center justify-between rounded-xl border border-ice/15 bg-navy/80 px-5 py-3.5 font-ui text-lg font-bold text-ice backdrop-blur active:bg-navy-raised/80"
          >
            <span>🤖 Vs Máquina</span>
            <span className="text-ice/40">›</span>
          </Link>
        </aside>
      </div>

      {/* Minijuegos */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-ui text-xl font-extrabold text-ice">Minijuegos</h2>
          <Link href="/jugar" className="font-ui text-sm font-bold text-volt">
            Ver todos ›
          </Link>
        </div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          <Link
            href="/jugar"
            className="relative w-64 shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-volt shadow-[0_0_24px_rgba(200,245,49,0.25)] lg:w-auto"
          >
            <Image
              src="/assets/jahuga__game_bg_penaltys.png"
              alt=""
              width={512}
              height={320}
              className="h-40 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/20 to-transparent" />
            <span className="absolute left-3 top-3 rounded-full bg-volt px-3 py-1 font-ui text-[11px] font-extrabold uppercase tracking-wide text-volt-ink">
              Destacado
            </span>
            <p className="absolute bottom-3 left-3 font-ui text-lg font-extrabold text-ice">
              Tandas de Penales
            </p>
          </Link>

          <MockGameCard emoji="🧠" name="Trivia" hue="from-[#1a2f6e]" />
          <MockGameCard emoji="🃏" name="Cartas RPG" hue="from-[#3a1a6e]" />
          <MockGameCard emoji="🏆" name="Modo Torneo" hue="from-[#6e4a1a]" />
        </div>
      </section>
    </main>
  );
}

/** Card bloqueada con mock hasta tener el arte real del juego. */
function MockGameCard({ emoji, name, hue }: { emoji: string; name: string; hue: string }) {
  return (
    <div className={`relative flex h-40 w-64 shrink-0 snap-start flex-col items-center justify-center overflow-hidden rounded-2xl border border-ice/10 bg-gradient-to-br ${hue} to-night lg:w-auto`}>
      <span className="absolute left-3 top-3 rounded-full bg-ice/10 px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-wide text-ice/70">
        Próximamente
      </span>
      <span className="text-4xl opacity-60" aria-hidden>
        {emoji}
      </span>
      <span className="mt-1 flex size-8 items-center justify-center rounded-full bg-night/60 text-ice/60">
        🔒
      </span>
      <p className="mt-1 font-ui text-base font-extrabold text-ice/70">{name}</p>
    </div>
  );
}

function AnonHome() {
  return (
    <main className="bg-stadium -mb-24 flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Image src="/assets/logo.svg" alt="Jahuga" width={280} height={71} priority />
      <p className="max-w-xs text-lg text-ice/70">
        Minijuegos entre amigos. Retá, apostá Coins y ganá reputación.
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
        <Link
          href="/play/local"
          className="flex min-h-12 items-center justify-center rounded-xl border border-ice/15 px-6 text-ice/80 active:bg-ice/5"
        >
          Probar penales sin cuenta
        </Link>
      </div>
    </main>
  );
}

function PlaySolid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="#101800" />
    </svg>
  );
}
