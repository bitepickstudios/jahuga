import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { ChallengeForm } from "./ChallengeForm";

export const metadata: Metadata = { title: "Retar — Lobby" };

export default async function RetarPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <header>
        <Link href="/jugar" className="text-sm text-chalk/60 underline underline-offset-4">
          ← Jugar
        </Link>
      </header>
      <h1 className="font-display text-4xl uppercase text-chalk">Retar a penales</h1>
      <ChallengeForm />
    </main>
  );
}
