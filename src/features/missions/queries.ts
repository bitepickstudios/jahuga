import { createClient } from "@/lib/supabase/server";

export interface MissionCard {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  needed: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

/** Misiones activas con el progreso de hoy del usuario. */
export async function getMissions(): Promise<MissionCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: missions }, { data: progress }] = await Promise.all([
    supabase.from("missions").select("*"),
    supabase.from("mission_progress").select("*").eq("period", today),
  ]);
  const progressById = Object.fromEntries((progress ?? []).map((p) => [p.mission_id, p]));

  return (missions ?? []).map((m) => {
    const p = progressById[m.id];
    const rule = m.rule as { count?: number };
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      reward: Number(m.reward_coins),
      needed: rule.count ?? 1,
      progress: p?.progress ?? 0,
      completed: Boolean(p?.completed_at),
      claimed: Boolean(p?.claimed_at),
    };
  });
}
