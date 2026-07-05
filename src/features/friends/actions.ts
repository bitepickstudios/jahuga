"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface FriendFormState {
  error: string | null;
  ok?: string | null;
}

const INVITE_COOKIE = "jahuga_invite";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function sendFriendRequest(
  _prev: FriendFormState,
  formData: FormData,
): Promise<FriendFormState> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida. Iniciá sesión de nuevo." };

  const nickname = String(formData.get("nickname") ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!nickname) return { error: "Escribí un nickname." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, nickname")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (!target) return { error: `No existe nadie con el nickname @${nickname}.` };
  if (target.id === user.id) return { error: "Con vos mismo ya sos amigo." };

  // Inserta como el usuario: la RLS exige requester = auth.uid()
  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: target.id });
  if (error) {
    if (error.code === "23505") return { error: `Ya hay una solicitud o amistad con @${target.nickname}.` };
    return { error: "No se pudo mandar la solicitud. Probá de nuevo." };
  }
  revalidatePath("/amigos");
  return { error: null, ok: `Solicitud enviada a @${target.nickname}.` };
}

export async function respondFriendRequest(
  requestId: string,
  accept: boolean,
): Promise<{ error: string | null }> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", requestId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  if (error) return { error: "No se pudo responder la solicitud." };
  revalidatePath("/amigos");
  revalidatePath("/");
  return { error: null };
}

/**
 * Reclama una invitación pendiente guardada en cookie por el middleware
 * (visitó /invite/[code] sin sesión). Crea la solicitud hacia el dueño del link.
 */
export async function claimPendingInvite(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const code = cookieStore.get(INVITE_COOKIE)?.value;
  if (!code) return;
  cookieStore.delete(INVITE_COOKIE);

  const admin = createAdminClient();
  const { data: owner } = await admin
    .from("profiles")
    .select("id")
    .eq("invite_code", code)
    .maybeSingle();
  if (!owner || owner.id === userId) return;

  // Ignorar duplicados: si ya hay vínculo, no pasa nada.
  await admin
    .from("friendships")
    .insert({ requester_id: userId, addressee_id: owner.id })
    .select()
    .maybeSingle();
}
