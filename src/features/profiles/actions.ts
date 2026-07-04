"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateEmail, validateNickname, validatePassword } from "./validation";

export interface AuthFormState {
  error: string | null;
  info?: string | null;
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const nickname = String(formData.get("nickname") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const invalid =
    validateNickname(nickname) ?? validateEmail(email) ?? validatePassword(password, confirm);
  if (invalid) return { error: invalid };

  const admin = createAdminClient();
  const { data: taken, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (lookupError) return { error: "No se pudo verificar el nickname. Probá de nuevo." };
  if (taken) return { error: "Ese nickname ya está en uso." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "Ese correo ya tiene cuenta. Iniciá sesión." };
    return { error: "No se pudo crear la cuenta. Probá de nuevo." };
  }
  if (!data.session) {
    return { error: null, info: "Revisá tu correo para confirmar la cuenta y después iniciá sesión." };
  }
  redirect("/onboarding");
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá correo y contraseña." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", data.user.id)
    .single();
  redirect(profile?.onboarding_completed ? "/" : "/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function completeOnboarding(input: {
  displayName: string;
  birthDate: string;
  photoUrl: string | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión vencida. Iniciá sesión de nuevo." };

  const displayName = input.displayName.trim();
  if (!displayName) return { error: "Contanos tu nombre." };
  if (!input.birthDate) return { error: "Necesitamos tu fecha de nacimiento." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      birth_date: input.birthDate,
      photo_url: input.photoUrl,
      onboarding_completed: true,
    })
    .eq("id", user.id);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  if (input.photoUrl) {
    await supabase.from("avatars").update({ photo_crop_url: input.photoUrl }).eq("profile_id", user.id);
  }
  redirect("/");
}

/** Campos editables del perfil (D4: nickname NO editable; la base también lo bloquea). */
export async function updateProfile(patch: {
  display_name?: string;
  is_public?: boolean;
  iconic_phrases?: string[];
  photo_url?: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión vencida. Iniciá sesión de nuevo." };

  if (patch.iconic_phrases) {
    patch.iconic_phrases = patch.iconic_phrases.map((p) => p.trim()).filter(Boolean).slice(0, 10);
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  if (patch.photo_url) {
    await supabase.from("avatars").update({ photo_crop_url: patch.photo_url }).eq("profile_id", user.id);
  }
  revalidatePath("/perfil");
  return { error: null };
}
