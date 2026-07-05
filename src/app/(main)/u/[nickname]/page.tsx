import type { Metadata } from "next";
import Link from "next/link";
import { Cake, SearchX } from "lucide-react";
import { getAvatar, getProfileByNickname } from "@/features/profiles/queries";
import { getProfileStats } from "@/features/matches/queries";
import { ageFrom, localDate } from "@/features/profiles/types";
import { PlayerAvatar } from "@/features/avatars/PlayerAvatar";

export const metadata: Metadata = { title: "Perfil — Jahuga" };

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname } = await params;
  const profile = await getProfileByNickname(decodeURIComponent(nickname));

  if (!profile) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 px-5 py-24 text-center">
        <SearchX size={56} className="text-ice/40" />
        <h1 className="font-ui text-2xl font-extrabold text-ice">Perfil no disponible</h1>
        <p className="text-ice/60">No existe o es privado. Si es tu amigo, pedile que te agregue.</p>
        <Link href="/" className="text-volt underline underline-offset-4">
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
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <section className="flex flex-col items-center gap-2 text-center">
        <PlayerAvatar photoUrl={avatar?.photo_crop_url ?? profile.photo_url} pose="idle" skinId={((avatar?.equipped as Record<string, string | null>)?.skin as string) ?? "albirroja"} className="h-52 w-40" />
        <h1 className="font-ui text-2xl font-extrabold text-ice">@{profile.nickname}</h1>
        <p className="text-ice/70">
          {profile.display_name}
          {age !== null && ` · ${age} años`}
        </p>
        {birthday && (
          <p className="flex items-center gap-1.5 text-sm text-ice/40">
            <Cake size={14} /> {birthday}
          </p>
        )}
      </section>

      {profile.iconic_phrases.length > 0 && (
        <section className="rounded-2xl border border-ice/15 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ice/50">
            Frases icónicas
          </h2>
          <ul className="flex flex-col gap-2">
            {profile.iconic_phrases.map((phrase, i) => (
              <li key={i} className="text-ice/90">
                “{phrase}”
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-md border border-ice/15 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Stats · Penales
        </h2>
        {penales ? (
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="font-ui text-3xl font-extrabold text-ice">{penales.played}</p>
              <p className="text-xs text-ice/40">jugadas</p>
            </div>
            <div>
              <p className="font-ui text-3xl font-extrabold text-ice">{penales.won}</p>
              <p className="text-xs text-ice/40">ganadas</p>
            </div>
            <div>
              <p className="font-ui text-3xl font-extrabold text-ice">
                {Math.round((penales.won / Math.max(penales.played, 1)) * 100)}%
              </p>
              <p className="text-xs text-ice/40">winrate</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ice/40">Todavía sin partidas online.</p>
        )}
      </section>
    </main>
  );
}
