import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAvatar, getOwnProfile } from "@/features/profiles/queries";
import { ProfileEditor } from "./ProfileEditor";

export const metadata: Metadata = { title: "Mi perfil — Lobby" };

export default async function PerfilPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");
  const avatar = await getAvatar(profile.id);

  return <ProfileEditor profile={profile} avatar={avatar} />;
}
