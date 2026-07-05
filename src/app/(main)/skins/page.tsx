import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { getBalance, getSkins } from "@/features/economy/queries";
import { SkinGrid } from "./SkinGrid";

export const metadata: Metadata = { title: "Skins — Jahuga" };

export default async function SkinsPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  const [skins, balance] = await Promise.all([getSkins(), getBalance()]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 lg:max-w-2xl">
      <header>
        <h1 className="font-ui text-3xl font-extrabold text-ice">Skins</h1>
        <p className="mt-1 text-ice/60">Camisetas para tu avatar. Se pagan con Coins ganadas jugando.</p>
      </header>
      <SkinGrid skins={skins} photoUrl={profile.photo_url} balance={balance ?? 0} />
    </main>
  );
}
