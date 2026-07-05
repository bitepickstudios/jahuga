import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { getMyGroup } from "@/features/groups/queries";
import { CreateGroupForm } from "./CreateGroupForm";
import { GroupView } from "./GroupView";

export const metadata: Metadata = { title: "Mi Grupo — Jahuga" };

export default async function GrupoPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  const myGroup = await getMyGroup();

  if (!myGroup) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
        <header>
          <h1 className="font-ui text-3xl font-extrabold text-ice">Creá tu grupo</h1>
          <p className="mt-1 text-ice/60">
            El grupo es tu barra: acá se acumulan las victorias de todos.
          </p>
        </header>
        <CreateGroupForm userId={profile.id} />
      </main>
    );
  }

  return <GroupView data={myGroup} meId={profile.id} />;
}
