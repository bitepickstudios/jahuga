import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = { title: "Bienvenida — Lobby" };

export default async function OnboardingPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");
  if (profile.onboarding_completed) redirect("/");

  return <OnboardingWizard nickname={profile.nickname} userId={profile.id} />;
}
