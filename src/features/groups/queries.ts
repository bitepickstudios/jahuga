import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  owner_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  nickname: string;
  display_name: string | null;
  photo_url: string | null;
  role: "owner" | "member";
  played: number;
  won: number;
}

export interface MyGroup {
  group: Group;
  members: GroupMember[];
  totals: { played: number; won: number };
  isOwner: boolean;
}

/** El grupo del usuario (v1: uno solo), con miembros y stats agregadas. */
export async function getMyGroup(): Promise<MyGroup | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Grupo + membresías vía RLS (el miembro ve su grupo).
  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!membership) return null;

  const [{ data: group }, { data: memberRows }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", membership.group_id).single(),
    supabase.from("group_members").select("profile_id, role").eq("group_id", membership.group_id),
  ]);
  if (!group || !memberRows) return null;

  // Perfiles/stats de los miembros con admin (para ver a compañeros con perfil privado).
  const admin = createAdminClient();
  const ids = memberRows.map((m) => m.profile_id);
  const [{ data: profiles }, { data: stats }] = await Promise.all([
    admin.from("profiles").select("id, nickname, display_name, photo_url").in("id", ids),
    admin.from("profile_stats").select("profile_id, played, won").eq("game_id", "penales").in("profile_id", ids),
  ]);

  const statById = Object.fromEntries((stats ?? []).map((s) => [s.profile_id, s]));
  const roleById = Object.fromEntries(memberRows.map((m) => [m.profile_id, m.role]));
  const members: GroupMember[] = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      nickname: p.nickname,
      display_name: p.display_name,
      photo_url: p.photo_url,
      role: (roleById[p.id] ?? "member") as "owner" | "member",
      played: statById[p.id]?.played ?? 0,
      won: statById[p.id]?.won ?? 0,
    }))
    .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : b.won - a.won));

  return {
    group: group as Group,
    members,
    totals: {
      played: members.reduce((acc, m) => acc + m.played, 0),
      won: members.reduce((acc, m) => acc + m.won, 0),
    },
    isOwner: (group as Group).owner_id === user.id,
  };
}
