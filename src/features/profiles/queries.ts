import { createClient } from "@/lib/supabase/server";
import type { Avatar, Profile } from "./types";

/** Perfil propio (o null sin sesión). */
export async function getOwnProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data as Profile | null;
}

/** Perfil por nickname a través de RLS: si no es visible para el viewer, devuelve null. */
export async function getProfileByNickname(nickname: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("nickname", nickname)
    .maybeSingle();
  return data as Profile | null;
}

export async function getAvatar(profileId: string): Promise<Avatar | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("avatars").select("*").eq("profile_id", profileId).maybeSingle();
  return data as Avatar | null;
}
