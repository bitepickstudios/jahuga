import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface FriendProfile {
  id: string;
  nickname: string;
  display_name: string | null;
  photo_url: string | null;
}

export interface FriendRequest {
  id: string;
  requester: FriendProfile;
  created_at: string;
}

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Amigos aceptados, con su perfil básico. */
export async function getFriends(): Promise<FriendProfile[]> {
  const user = await me();
  if (!user) return [];
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted");
  if (!rows?.length) return [];

  const ids = rows.map((r) => (r.requester_id === user.id ? r.addressee_id : r.requester_id));
  // Amigos aceptados siempre son visibles por RLS, pero usamos admin para
  // devolver el set completo en una sola query estable.
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, nickname, display_name, photo_url")
    .in("id", ids)
    .order("nickname");
  return (data ?? []) as FriendProfile[];
}

/** Solicitudes recibidas pendientes (el nickname del solicitante se muestra siempre). */
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const user = await me();
  if (!user) return [];
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("id, requester_id, created_at")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (!rows?.length) return [];

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nickname, display_name, photo_url")
    .in("id", rows.map((r) => r.requester_id));
  const byId = Object.fromEntries(((profiles ?? []) as FriendProfile[]).map((p) => [p.id, p]));
  return rows
    .filter((r) => byId[r.requester_id])
    .map((r) => ({ id: r.id, requester: byId[r.requester_id], created_at: r.created_at }));
}

/** Nicknames a los que ya les mandaste solicitud (para mostrar estado). */
export async function getOutgoingPendingNicknames(): Promise<string[]> {
  const user = await me();
  if (!user) return [];
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("addressee_id")
    .eq("requester_id", user.id)
    .eq("status", "pending");
  if (!rows?.length) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("nickname")
    .in("id", rows.map((r) => r.addressee_id));
  return (data ?? []).map((p) => p.nickname);
}
