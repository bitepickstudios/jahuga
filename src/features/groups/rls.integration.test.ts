/**
 * RLS de Fase 4: grupos visibles solo para miembros; compañeros de grupo
 * se ven el perfil aunque sea privado. Corre con `pnpm test:integration`
 * (requiere migración 3 aplicada).
 */
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PASSWORD = "Prueba1234!";
const stamp = Date.now();

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const users: User[] = [];

async function createTestUser(nickname: string): Promise<{ client: SupabaseClient; user: User }> {
  const { data, error } = await admin.auth.admin.createUser({
    email: `${nickname}@test.lobby`,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { nickname },
  });
  if (error) throw error;
  users.push(data.user);
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email: `${nickname}@test.lobby`, password: PASSWORD });
  return { client, user: data.user };
}

describe("RLS de grupos (Fase 4)", () => {
  let owner: { client: SupabaseClient; user: User };
  let member: { client: SupabaseClient; user: User };
  let outsider: { client: SupabaseClient; user: User };
  let groupId: string;

  beforeAll(async () => {
    owner = await createTestUser(`rls_g_owner_${stamp}`);
    member = await createTestUser(`rls_g_member_${stamp}`);
    outsider = await createTestUser(`rls_g_out_${stamp}`);

    const { data: group, error } = await admin
      .from("groups")
      .insert({ name: "Grupo Test", owner_id: owner.user.id })
      .select("id")
      .single();
    if (error) throw error;
    groupId = group.id;
    await admin.from("group_members").insert([
      { group_id: groupId, profile_id: owner.user.id, role: "owner" },
      { group_id: groupId, profile_id: member.user.id },
    ]);
    // El miembro se pone privado para probar visibilidad entre compañeros
    await admin.from("profiles").update({ is_public: false }).eq("id", member.user.id);
  }, 60_000);

  afterAll(async () => {
    await admin.from("groups").delete().eq("id", groupId);
    for (const u of users) await admin.auth.admin.deleteUser(u.id);
  }, 60_000);

  test("un miembro ve su grupo", async () => {
    const { data } = await member.client.from("groups").select("id").eq("id", groupId);
    expect(data).toHaveLength(1);
  });

  test("un no-miembro NO ve el grupo ni sus miembros", async () => {
    const { data: g } = await outsider.client.from("groups").select("id").eq("id", groupId);
    expect(g).toEqual([]);
    const { data: m } = await outsider.client.from("group_members").select("*").eq("group_id", groupId);
    expect(m).toEqual([]);
  });

  test("un cliente no puede escribir groups/group_members directo", async () => {
    const { error: gError } = await outsider.client
      .from("groups")
      .insert({ name: "Hackeado", owner_id: outsider.user.id });
    expect(gError).not.toBeNull();
    const { error: mError } = await outsider.client
      .from("group_members")
      .insert({ group_id: groupId, profile_id: outsider.user.id });
    expect(mError).not.toBeNull();
  });

  test("compañeros de grupo se ven el perfil aunque sea privado", async () => {
    const { data: fromOwner } = await owner.client
      .from("profiles")
      .select("id")
      .eq("id", member.user.id);
    expect(fromOwner).toHaveLength(1);

    const { data: fromOutsider } = await outsider.client
      .from("profiles")
      .select("id")
      .eq("id", member.user.id);
    expect(fromOutsider).toEqual([]);
  });
});
