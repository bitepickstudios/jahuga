import Link from "next/link";
import { ChevronRight, Trophy, Users } from "lucide-react";
import type { MyGroup } from "@/features/groups/queries";

/** Card de Mi Grupo para el lobby (izquierda). */
export function GroupCard({ myGroup }: { myGroup: MyGroup | null }) {
  return (
    <Link
      href="/grupo"
      className="block rounded-2xl border border-ice/10 bg-navy/80 p-4 backdrop-blur transition-colors hover:border-ice/20 active:bg-navy-raised/80"
    >
      <div className="flex items-center justify-between">
        <h2 className="truncate font-ui text-base font-extrabold text-ice">
          {myGroup ? myGroup.group.name : "Mi Grupo"}
        </h2>
        <ChevronRight size={18} className="shrink-0 text-ice/40" />
      </div>

      {myGroup ? (
        <>
          <div className="mt-3 flex -space-x-2">
            {myGroup.members.slice(0, 5).map((m) =>
              m.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.photo_url}
                  alt=""
                  className="size-9 rounded-full border-2 border-navy object-cover"
                />
              ) : (
                <span
                  key={m.id}
                  className="flex size-9 items-center justify-center rounded-full border-2 border-navy bg-navy-raised"
                >
                  <Users size={16} className="text-ice/60" />
                </span>
              ),
            )}
          </div>
          <div className="mt-3 flex gap-4 text-sm text-ice/70">
            <span className="flex items-center gap-1.5">
              <Users size={15} className="text-ice/50" /> {myGroup.members.length}
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy size={15} className="text-gold" /> {myGroup.totals.won} victorias
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-ice/50">Armá tu grupo de amigos y compitan entre todos.</p>
          <span className="mt-3 inline-block rounded-full bg-volt px-3 py-1 font-ui text-[11px] font-extrabold uppercase tracking-wide text-volt-ink">
            Crear grupo
          </span>
        </>
      )}
    </Link>
  );
}
