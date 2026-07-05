"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GroupFormState {
  error: string | null;
  ok?: string | null;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** ¿Ya está en un grupo? Regla v1: uno solo por usuario (en la app, no en el esquema). */
async function currentGroupId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("group_members")
    .select("group_id")
    .eq("profile_id", userId)
    .maybeSingle();
  return data?.group_id ?? null;
}

export async function createGroup(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida. Iniciá sesión de nuevo." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;
  if (name.length < 2 || name.length > 40) return { error: "El nombre necesita entre 2 y 40 caracteres." };

  if (await currentGroupId(user.id)) return { error: "Ya estás en un grupo (v1 permite uno solo)." };

  const admin = createAdminClient();
  const { data: group, error } = await admin
    .from("groups")
    .insert({ name, description, image_url: imageUrl, owner_id: user.id })
    .select("id")
    .single();
  if (error || !group) return { error: "No se pudo crear el grupo. Probá de nuevo." };

  const { error: memberError } = await admin
    .from("group_members")
    .insert({ group_id: group.id, profile_id: user.id, role: "owner" });
  if (memberError) {
    await admin.from("groups").delete().eq("id", group.id);
    return { error: "No se pudo crear el grupo. Probá de nuevo." };
  }

  redirect("/grupo");
}

export async function addGroupMember(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const nickname = String(formData.get("nickname") ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!nickname) return { error: "Escribí un nickname." };

  const admin = createAdminClient();
  const { data: group } = await admin.from("groups").select("id").eq("owner_id", user.id).maybeSingle();
  if (!group) return { error: "Solo el dueño del grupo puede invitar." };

  const { data: target } = await admin
    .from("profiles")
    .select("id, nickname")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (!target) return { error: `No existe nadie con el nickname @${nickname}.` };
  if (await currentGroupId(target.id)) return { error: `@${target.nickname} ya está en un grupo.` };

  const { error } = await admin
    .from("group_members")
    .insert({ group_id: group.id, profile_id: target.id });
  if (error) return { error: "No se pudo sumar al grupo." };

  revalidatePath("/grupo");
  return { error: null, ok: `@${target.nickname} ya es parte del grupo.` };
}

export async function leaveGroup(): Promise<{ error: string | null }> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("group_members")
    .select("group_id, role")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "No estás en un grupo." };
  if (membership.role === "owner") {
    return { error: "Sos el dueño: para salir tenés que disolver el grupo." };
  }

  await admin.from("group_members").delete().eq("group_id", membership.group_id).eq("profile_id", user.id);
  revalidatePath("/grupo");
  revalidatePath("/");
  return { error: null };
}

export async function dissolveGroup(): Promise<{ error: string | null }> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };

  const admin = createAdminClient();
  const { error } = await admin.from("groups").delete().eq("owner_id", user.id);
  if (error) return { error: "No se pudo disolver el grupo." };
  revalidatePath("/grupo");
  revalidatePath("/");
  return { error: null };
}

export async function removeGroupMember(profileId: string): Promise<{ error: string | null }> {
  const user = await requireUser();
  if (!user) return { error: "Sesión vencida." };
  if (profileId === user.id) return { error: "Para salirte usá «Salir del grupo»." };

  const admin = createAdminClient();
  const { data: group } = await admin.from("groups").select("id").eq("owner_id", user.id).maybeSingle();
  if (!group) return { error: "Solo el dueño puede sacar miembros." };

  await admin.from("group_members").delete().eq("group_id", group.id).eq("profile_id", profileId);
  revalidatePath("/grupo");
  return { error: null };
}
