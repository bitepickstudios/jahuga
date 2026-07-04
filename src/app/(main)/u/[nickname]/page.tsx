import type { Metadata } from "next";
import Link from "next/link";
import { getAvatar, getProfileByNickname } from "@/features/profiles/queries";
import { getProfileStats } from "@/features/matches/queries";
import { ageFrom, localDate } from "@/features/profiles/types";
import { PlayerAvatar } from "@/features/avatars/PlayerAvatar";

export const metadata: Metadata = { title: "Perfil — Lobby" };

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname } = await params;
  const profile = await getProfileByNickname(decodeURIComponent(nickname));

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-5xl">🕵️</p>
        <h1 className="font-display text-3xl uppercase text-chalk">Perfil no disponible</h1>
        <p className="text-chalk/60">No existe o es privado. Si es tu amigo, pedile que te agregue.</p>
        <Link href="/" className="text-albirroja underline underline-offset-4">
          Volver al lobby
        </Link>
      </main>
    );
  }

  const [avatar, stats] = await Promise.all([getAvatar(profile.id), getProfileStats(profile.id)]);
  const penales = stats.find((s) => s.game_id === "penales") ?? null;
  const age = ageFrom(profile.birth_date);
  const birthday = profile.birth_date
    ? localDate(profile.birth_date).toLocaleDateString("es-PY", { day: "numeric", month: "long" })
    : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <header>
        <Link href="/" className="text-sm text-chalk/60 underline underline-offset-4">
          ← Lobby
        </Link>
      </header>

      <section className="flex flex-col items-center gap-2 text-center">
        <PlayerAvatar photoUrl={avatar?.photo_crop_url ?? profile.photo_url} pose="idle" className="h-52 w-40" />
        <h1 className="font-display text-3xl uppercase text-chalk">@{profile.nickname}</h1>
        <p className="text-chalk/70">
          {profile.display_name}
          {age !== null && ` · ${age} años`}
        </p>
        {birthday && <p className="text-sm text-chalk/40">🎂 {birthday}</p>}
      </section>

      {profile.iconic_phrases.length > 0 && (
        <section className="rounded-md border border-chalk/15 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-chalk/50">
            Frases icónicas
          </h2>
          <ul className="flex flex-col gap-2">
            {profile.iconic_phrases.map((phrase, i) => (
              <li key={i} className="text-chalk/90">
                “{phrase}”
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-md border border-chalk/15 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-chalk/50">
          Stats · Penales
        </h2>
        {penales ? (
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="font-display text-3xl text-chalk">{penales.played}</p>
              <p className="text-xs text-chalk/40">jugadas</p>
            </div>
            <div>
              <p className="font-display text-3xl text-chalk">{penales.won}</p>
              <p className="text-xs text-chalk/40">ganadas</p>
            </div>
            <div>
              <p className="font-display text-3xl text-chalk">
                {Math.round((penales.won / Math.max(penales.played, 1)) * 100)}%
              </p>
              <p className="text-xs text-chalk/40">winrate</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-chalk/40">Todavía sin partidas online.</p>
        )}
      </section>
    </main>
  );
}
