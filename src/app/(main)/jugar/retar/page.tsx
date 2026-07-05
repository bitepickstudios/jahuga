import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { ChallengeForm } from "./ChallengeForm";

export const metadata: Metadata = { title: "Retar — Jahuga" };

export default async function RetarPage({
  searchParams,
}: {
  searchParams: Promise<{ nick?: string }>;
}) {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");
  const { nick } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      <header>
        <Link href="/jugar" className="text-sm text-ice/60 underline underline-offset-4">
          ← Jugar
        </Link>
      </header>
      <h1 className="font-ui text-3xl font-extrabold text-ice">Retar a penales</h1>
      <ChallengeForm defaultNickname={nick ?? ""} />
    </main>
  );
}
