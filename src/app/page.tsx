import Link from "next/link";
import { getOwnProfile } from "@/features/profiles/queries";
import { getPendingChallenges } from "@/features/matches/queries";
import { PlayerAvatar } from "@/features/avatars/PlayerAvatar";
import { redirect } from "next/navigation";

// ponytail: sin env de Supabase (previo a Fase 2 aplicada) el home cae a la landing anónima.
const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export default async function Home() {
  const profile = hasSupabaseEnv ? await getOwnProfile() : null;

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  if (!profile) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <h1 className="font-display text-7xl uppercase text-chalk">
          Lobby<span className="text-albirroja">.</span>
        </h1>
        <p className="max-w-xs text-lg text-chalk/60">
          Minijuegos entre amigos. Retá, apostá Lobby Coins y ganá reputación.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {hasSupabaseEnv && (
            <>
              <Link
                href="/registro"
                className="flex min-h-12 items-center justify-center rounded-md bg-albirroja px-6 font-display text-xl uppercase tracking-wide text-chalk transition-transform active:scale-95"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="flex min-h-12 items-center justify-center rounded-md border border-chalk/25 px-6 text-chalk/90 active:bg-chalk/5"
              >
                Entrar
              </Link>
            </>
          )}
          <Link
            href="/play/local"
            className="flex min-h-12 items-center justify-center rounded-md border border-chalk/25 px-6 text-chalk/90 active:bg-chalk/5"
          >
            Probar penales sin cuenta
          </Link>
        </div>
      </main>
    );
  }

  const challenges = await getPendingChallenges();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl uppercase text-chalk">
          Lobby<span className="text-albirroja">.</span>
        </span>
        <Link href="/perfil" className="text-sm text-chalk/70 underline underline-offset-4">
          @{profile.nickname}
        </Link>
      </header>

      {challenges.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-chalk/50">
            Retos pendientes
          </h2>
          {challenges.map((c) => (
            <Link
              key={c.id}
              href={`/play/${c.id}`}
              className="flex items-center justify-between rounded-md border border-albirroja/50 bg-albirroja/10 px-4 py-3 active:bg-albirroja/20"
            >
              <span className="text-chalk">
                ⚔️ <strong>{c.challenger?.display_name ?? `@${c.challenger?.nickname}`}</strong> te retó
              </span>
              <span className="text-xs uppercase tracking-wide text-chalk/50">
                {c.mode === "live" ? "en vivo" : "async"}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-col items-center gap-4 text-center">
        <PlayerAvatar photoUrl={profile.photo_url} pose="idle" className="h-64 w-52" />
        <p className="text-chalk/60">¿Listo, {profile.display_name ?? `@${profile.nickname}`}?</p>
        <Link
          href="/jugar"
          className="flex min-h-14 w-full max-w-xs items-center justify-center rounded-md bg-albirroja px-6 font-display text-2xl uppercase tracking-wide text-chalk transition-transform active:scale-95"
        >
          Jugar
        </Link>
      </section>
    </main>
  );
}
