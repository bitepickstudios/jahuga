"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function claimMission(missionId: string): Promise<{ error: string | null; reward?: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_claim_mission", { p_mission: missionId });
  if (error) return { error: error.message.replace(/^.*?: /, "") };
  revalidatePath("/");
  return { error: null, reward: Number(data) };
}
