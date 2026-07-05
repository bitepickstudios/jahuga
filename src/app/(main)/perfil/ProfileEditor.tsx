"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { Cake, Camera, Handshake, Trophy, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut, updateProfile } from "@/features/profiles/actions";
import { ageFrom, localDate, type Avatar, type Profile } from "@/features/profiles/types";
import { PlayerAvatar } from "@/features/avatars/PlayerAvatar";

export interface HistoryEntry {
  id: string;
  rivalName: string;
  myScore: number;
  rivalScore: number;
  result: "won" | "lost" | "draw";
}

export function ProfileEditor({
  profile,
  avatar,
  stats,
  history,
}: {
  profile: Profile;
  avatar: Avatar | null;
  stats: { played: number; won: number } | null;
  history: HistoryEntry[];
}) {
  const [phrases, setPhrases] = useState(profile.iconic_phrases);
  const [newPhrase, setNewPhrase] = useState("");
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [photoUrl, setPhotoUrl] = useState(avatar?.photo_crop_url ?? profile.photo_url);
  const skinId = ((avatar?.equipped as Record<string, string | null>)?.skin as string) ?? "albirroja";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const age = ageFrom(profile.birth_date);
  const birthday = profile.birth_date
    ? localDate(profile.birth_date).toLocaleDateString("es-PY", { day: "numeric", month: "long" })
    : null;

  async function run(patch: Parameters<typeof updateProfile>[0]) {
    setBusy(true);
    setError(null);
    const result = await updateProfile(patch);
    if (result.error) setError(result.error);
    setBusy(false);
    return !result.error;
  }

  async function addPhrase() {
    const phrase = newPhrase.trim();
    if (!phrase || phrases.length >= 10) return;
    const next = [...phrases, phrase];
    if (await run({ iconic_phrases: next })) {
      setPhrases(next);
      setNewPhrase("");
    }
  }

  async function removePhrase(index: number) {
    const next = phrases.filter((_, i) => i !== index);
    if (await run({ iconic_phrases: next })) setPhrases(next);
  }

  async function togglePublic(value: boolean) {
    setIsPublic(value);
    if (!(await run({ is_public: value }))) setIsPublic(!value);
  }

  async function changePhoto(file: File) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/foto-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);
    if (uploadError) {
      setError("No se pudo subir la foto.");
      setBusy(false);
      return;
    }
    const url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
    if (await run({ photo_url: url })) setPhotoUrl(url);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-end">
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <section className="flex flex-col items-center gap-2 text-center">
        <PlayerAvatar photoUrl={photoUrl} pose="idle" skinId={skinId} className="h-52 w-40" />
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
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-volt underline underline-offset-4">
          <Camera size={14} /> {busy ? "Guardando..." : "Cambiar foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && changePhoto(e.target.files[0])}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-ice/15 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Frases icónicas
        </h2>
        <ul className="flex flex-col gap-2">
          {phrases.map((phrase, i) => (
            <li key={`${phrase}-${i}`} className="flex items-center justify-between gap-2">
              <span className="text-ice/90">“{phrase}”</span>
              <button
                type="button"
                onClick={() => removePhrase(i)}
                disabled={busy}
                aria-label={`Borrar frase: ${phrase}`}
                className="flex min-h-8 min-w-8 items-center justify-center rounded-full text-ice/40 active:text-danger"
              >
                <X size={16} />
              </button>
            </li>
          ))}
          {phrases.length === 0 && <li className="text-sm text-ice/40">Todavía no cargaste ninguna.</li>}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPhrase()}
            placeholder="Tu frase célebre"
            maxLength={120}
            className="min-h-11 flex-1 rounded-xl border border-ice/20 bg-night px-3 text-ice placeholder:text-ice/30"
          />
          <Button variant="secondary" onPress={addPhrase} isDisabled={busy || !newPhrase.trim()}>
            Agregar
          </Button>
        </div>
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-ice/15 p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ice/50">Perfil público</h2>
          <p className="text-sm text-ice/40">
            {isPublic ? "Cualquiera puede ver tu perfil." : "Solo tus amigos pueden verte."}
          </p>
        </div>
        {/* ponytail: toggle nativo — el Switch de HeroUI v3 renderizaba un div sin role */}
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-label="Perfil público"
          disabled={busy}
          onClick={() => togglePublic(!isPublic)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            isPublic ? "bg-volt" : "bg-ice/20"
          }`}
        >
          <span
            className={`absolute top-1 size-6 rounded-full bg-ice transition-all ${
              isPublic ? "left-7" : "left-1"
            }`}
          />
        </button>
      </section>

      <section className="rounded-2xl border border-ice/15 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Stats · Penales
        </h2>
        {stats ? (
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="font-ui text-3xl font-extrabold text-ice">{stats.played}</p>
              <p className="text-xs text-ice/40">jugadas</p>
            </div>
            <div>
              <p className="font-ui text-3xl font-extrabold text-ice">{stats.won}</p>
              <p className="text-xs text-ice/40">ganadas</p>
            </div>
            <div>
              <p className="font-ui text-3xl font-extrabold text-ice">
                {Math.round((stats.won / Math.max(stats.played, 1)) * 100)}%
              </p>
              <p className="text-xs text-ice/40">winrate</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ice/40">Todavía no jugaste partidas online. Retá a alguien.</p>
        )}
      </section>

      {history.length > 0 && (
        <section className="rounded-2xl border border-ice/15 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-ice/50">
            Últimas partidas
          </h2>
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-ice/80">
                  {h.result === "won" ? (
                    <Trophy size={15} className="text-gold" />
                  ) : h.result === "lost" ? (
                    <X size={15} className="text-danger" />
                  ) : (
                    <Handshake size={15} className="text-ice/50" />
                  )}
                  vs {h.rivalName}
                </span>
                <span className="font-ui text-lg font-extrabold text-ice">
                  {h.myScore} – {h.rivalScore}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </main>
  );
}
