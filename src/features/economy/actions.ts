"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface EconomyFormState {
  error: string | null;
  ok?: string | null;
}

/** Convierte el error crudo de Postgres en un mensaje humano. */
function humanize(message: string): string {
  if (message.includes("balance_check") || message.includes("wallets")) {
    return "No te alcanzan las Coins.";
  }
  // Los raise exception de las funciones ya vienen en español
  return message.replace(/^.*?: /, "");
}

export async function transferCoins(_prev: EconomyFormState, formData: FormData): Promise<EconomyFormState> {
  const to = String(formData.get("to") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (!to) return { error: "Elegí a quién transferirle." };
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Monto inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_transfer", { p_to: to, p_amount: amount });
  if (error) return { error: humanize(error.message) };
  revalidatePath("/wallet");
  return { error: null, ok: "Transferencia hecha." };
}

export async function checkinStreak(): Promise<{ days: number; reward: number } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc("fn_streak_checkin");
  if (error || !data?.length) return null;
  return { days: data[0].days, reward: Number(data[0].reward) };
}

export async function buySkin(skinId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_buy_skin", { p_skin: skinId });
  if (error) return { error: humanize(error.message) };
  revalidatePath("/skins");
  return { error: null };
}

export async function equipSkin(skinId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión vencida." };

  const { data: owned } = await supabase
    .from("skin_ownership")
    .select("skin_id")
    .eq("skin_id", skinId)
    .maybeSingle();
  if (!owned) return { error: "No tenés esa skin todavía." };

  const { data: avatar } = await supabase
    .from("avatars")
    .select("equipped")
    .eq("profile_id", user.id)
    .maybeSingle();
  const equipped = { ...((avatar?.equipped as Record<string, unknown>) ?? {}), skin: skinId };
  const { error } = await supabase.from("avatars").update({ equipped }).eq("profile_id", user.id);
  if (error) return { error: "No se pudo equipar." };
  revalidatePath("/skins");
  revalidatePath("/");
  revalidatePath("/perfil");
  return { error: null };
}
