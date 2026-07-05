import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { getFriends, getIncomingRequests, getOutgoingPendingNicknames } from "@/features/friends/queries";
import { AddFriendForm } from "./AddFriendForm";
import { RequestActions } from "./RequestActions";
import { CopyInviteLink } from "./CopyInviteLink";

export const metadata: Metadata = { title: "Amigos — Jahuga" };

export default async function AmigosPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  const [friends, incoming, outgoing] = await Promise.all([
    getFriends(),
    getIncomingRequests(),
    getOutgoingPendingNicknames(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 lg:max-w-2xl">
      <h1 className="font-ui text-3xl font-extrabold text-ice">Amigos</h1>

      <section className="rounded-2xl border border-ice/10 bg-navy/80 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Tu link de invitación
        </h2>
        <p className="mb-3 text-sm text-ice/60">
          Compartilo: el que entre queda conectado con vos al crear su cuenta.
        </p>
        <CopyInviteLink code={profile.invite_code} />
      </section>

      <section className="rounded-2xl border border-ice/10 bg-navy/80 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Agregar por nickname
        </h2>
        <AddFriendForm />
        {outgoing.length > 0 && (
          <p className="mt-3 text-xs text-ice/40">
            Esperando respuesta: {outgoing.map((n) => `@${n}`).join(", ")}
          </p>
        )}
      </section>

      {incoming.length > 0 && (
        <section className="rounded-2xl border border-volt/40 bg-navy/80 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-volt">
            Solicitudes recibidas
          </h2>
          <ul className="flex flex-col gap-3">
            {incoming.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                {r.requester.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.requester.photo_url} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-navy-raised">🙂</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-ui font-bold text-ice">
                    {r.requester.display_name ?? `@${r.requester.nickname}`}
                  </p>
                  <p className="truncate text-xs text-ice/40">@{r.requester.nickname}</p>
                </div>
                <RequestActions requestId={r.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-ice/10 bg-navy/80 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Tus amigos ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-ice/40">
            Todavía nadie. Mandá tu link o agregá por nickname y empezá a retar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-3">
                {f.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.photo_url} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-navy-raised">🙂</span>
                )}
                <Link href={`/u/${f.nickname}`} className="min-w-0 flex-1">
                  <p className="truncate font-ui font-bold text-ice">{f.display_name ?? `@${f.nickname}`}</p>
                  <p className="truncate text-xs text-ice/40">@{f.nickname}</p>
                </Link>
                <Link
                  href={`/jugar/retar?nick=${encodeURIComponent(f.nickname)}`}
                  className="flex min-h-10 items-center rounded-xl bg-volt px-4 font-ui text-sm font-extrabold text-volt-ink transition-transform active:scale-95"
                >
                  ⚔️ Retar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
