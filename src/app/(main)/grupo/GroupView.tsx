"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label, TextField } from "@heroui/react";
import { Crown, Shield, Swords, User, X } from "lucide-react";
import {
  addGroupMember,
  dissolveGroup,
  leaveGroup,
  removeGroupMember,
  type GroupFormState,
} from "@/features/groups/actions";
import type { MyGroup } from "@/features/groups/queries";
import { localDate } from "@/features/profiles/types";

const INITIAL: GroupFormState = { error: null };

export function GroupView({ data, meId }: { data: MyGroup; meId: string }) {
  const router = useRouter();
  const { group, members, totals, isOwner } = data;
  const [addState, addAction, adding] = useActionState(addGroupMember, INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const created = localDate(group.created_at.slice(0, 10)).toLocaleDateString("es-PY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function onLeave() {
    setBusy(true);
    const result = await leaveGroup();
    if (result.error) setError(result.error);
    setBusy(false);
    router.refresh();
  }

  async function onDissolve() {
    if (!confirm("¿Disolver el grupo para todos? No se puede deshacer.")) return;
    setBusy(true);
    const result = await dissolveGroup();
    if (result.error) setError(result.error);
    setBusy(false);
    router.refresh();
  }

  async function onRemove(profileId: string) {
    setBusy(true);
    const result = await removeGroupMember(profileId);
    if (result.error) setError(result.error);
    setBusy(false);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 lg:max-w-2xl">
      <header className="flex items-center gap-4">
        {group.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={group.image_url} alt="" className="size-16 rounded-2xl object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-2xl bg-navy-raised text-ice/60">
            <Shield size={30} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-ui text-2xl font-extrabold text-ice">{group.name}</h1>
          {group.description && <p className="truncate text-sm text-ice/60">{group.description}</p>}
          <p className="text-xs text-ice/40">Desde el {created}</p>
        </div>
      </header>

      <section className="grid grid-cols-3 rounded-2xl border border-ice/10 bg-navy/80 p-4 text-center">
        <div>
          <p className="font-ui text-3xl font-extrabold text-ice">{members.length}</p>
          <p className="text-xs text-ice/40">miembros</p>
        </div>
        <div>
          <p className="font-ui text-3xl font-extrabold text-ice">{totals.played}</p>
          <p className="text-xs text-ice/40">partidas</p>
        </div>
        <div>
          <p className="font-ui text-3xl font-extrabold text-gold">{totals.won}</p>
          <p className="text-xs text-ice/40">victorias</p>
        </div>
      </section>

      <section className="rounded-2xl border border-ice/10 bg-navy/80 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ice/50">Miembros</h2>
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              {m.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photo_url} alt="" className="size-10 rounded-full object-cover" />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-navy-raised text-ice/60">
                  <User size={18} />
                </span>
              )}
              <Link href={`/u/${m.nickname}`} className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-ui font-bold text-ice">
                  {m.display_name ?? `@${m.nickname}`}
                  {m.role === "owner" && <Crown size={15} className="text-gold" />}
                </p>
                <p className="text-xs text-ice/40">
                  {m.played} jugadas · {m.won} ganadas
                </p>
              </Link>
              {m.id !== meId && (
                <Link
                  href={`/jugar/retar?nick=${encodeURIComponent(m.nickname)}`}
                  aria-label={`Retar a @${m.nickname}`}
                  className="flex min-h-10 items-center rounded-xl bg-volt px-3 font-ui text-sm font-extrabold text-volt-ink transition-transform active:scale-95"
                >
                  <Swords size={16} />
                </Link>
              )}
              {isOwner && m.id !== meId && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(m.id)}
                  aria-label={`Sacar a @${m.nickname}`}
                  className="flex size-10 items-center justify-center rounded-xl border border-ice/15 text-ice/50 active:text-danger"
                >
                  <X size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section className="rounded-2xl border border-ice/10 bg-navy/80 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ice/50">
            Sumar por nickname
          </h2>
          <form action={addAction} className="flex gap-2">
            <TextField name="nickname" type="text" isRequired fullWidth aria-label="Nickname">
              <Label className="sr-only">Nickname</Label>
              <Input placeholder="@nickname" autoCapitalize="none" autoComplete="off" />
            </TextField>
            <Button type="submit" variant="primary" isDisabled={adding} className="min-h-11 shrink-0">
              {adding ? "..." : "Sumar"}
            </Button>
          </form>
          {addState.error && <p className="mt-2 text-sm text-danger">{addState.error}</p>}
          {addState.ok && <p className="mt-2 text-sm text-volt">{addState.ok}</p>}
        </section>
      )}

      <section className="flex flex-col gap-2">
        {isOwner ? (
          <Button variant="danger-soft" fullWidth className="min-h-11" isDisabled={busy} onPress={onDissolve}>
            Disolver grupo
          </Button>
        ) : (
          <Button variant="ghost" fullWidth className="min-h-11" isDisabled={busy} onPress={onLeave}>
            Salir del grupo
          </Button>
        )}
        {error && <p className="text-center text-sm text-danger">{error}</p>}
      </section>
    </main>
  );
}
