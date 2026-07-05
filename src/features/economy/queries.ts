import { createClient } from "@/lib/supabase/server";

export interface CoinTransaction {
  id: string;
  amount: number;
  kind: string;
  ref_id: string | null;
  created_at: string;
}

export interface Skin {
  id: string;
  name: string;
  kind: string;
  price_coins: number | null;
  asset_ref: string;
  owned: boolean;
  equipped: boolean;
}

export async function getBalance(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("wallets").select("balance").eq("profile_id", user.id).maybeSingle();
  return data ? Number(data.balance) : null;
}

export async function getTransactions(limit = 30): Promise<CoinTransaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coin_transactions")
    .select("id, amount, kind, ref_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CoinTransaction[];
}

export async function getStreak(): Promise<{ current_days: number; last_check_in: string | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("streaks").select("current_days, last_check_in").eq("profile_id", user.id).maybeSingle();
  return data ?? null;
}

/** Catálogo de skins con propiedad y equipada del usuario actual. */
export async function getSkins(): Promise<Skin[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: skins }, { data: owned }, { data: avatar }] = await Promise.all([
    supabase.from("skins").select("*").order("price_coins", { ascending: true, nullsFirst: true }),
    user ? supabase.from("skin_ownership").select("skin_id") : Promise.resolve({ data: [] }),
    user
      ? supabase.from("avatars").select("equipped").eq("profile_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const ownedSet = new Set((owned ?? []).map((o) => o.skin_id));
  const equippedSkin =
    ((avatar?.equipped as Record<string, string | null> | null)?.skin as string | undefined) ?? "albirroja";
  return ((skins ?? []) as Omit<Skin, "owned" | "equipped">[]).map((s) => ({
    ...s,
    price_coins: s.price_coins === null ? null : Number(s.price_coins),
    owned: ownedSet.has(s.id),
    equipped: s.id === equippedSkin,
  }));
}
