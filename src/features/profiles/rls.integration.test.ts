/**
 * Test de RLS contra el proyecto Supabase real (gate de Fase 2 del roadmap):
 * un perfil privado NO es visible para un no-amigo.
 *
 * Corre solo con env presente: `pnpm test:integration`.
 * Necesita NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PASSWORD = "Prueba1234!";
const stamp = Date.now();

function anonClient() {
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

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
  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email: `${nickname}@test.lobby`,
    password: PASSWORD,
  });
  if (signInError) throw signInError;
  return { client, user: data.user };
}

describe("RLS de profiles (Fase 2)", () => {
  let privado: { client: SupabaseClient; user: User };
  let extranio: { client: SupabaseClient; user: User };

  beforeAll(async () => {
    privado = await createTestUser(`rls_privado_${stamp}`);
    extranio = await createTestUser(`rls_extranio_${stamp}`);
    // El primero se pone privado
    const { error } = await privado.client
      .from("profiles")
      .update({ is_public: false })
      .eq("id", privado.user.id);
    if (error) throw error;
  }, 30_000);

  afterAll(async () => {
    for (const u of users) await admin.auth.admin.deleteUser(u.id);
  }, 30_000);

  test("el dueño ve su propio perfil privado", async () => {
    const { data } = await privado.client.from("profiles").select("id").eq("id", privado.user.id);
    expect(data).toHaveLength(1);
  });

  test("un no-amigo NO ve el perfil privado", async () => {
    const { data } = await extranio.client.from("profiles").select("id").eq("id", privado.user.id);
    expect(data).toEqual([]);
  });

  test("un anónimo NO ve el perfil privado", async () => {
    const { data } = await anonClient().from("profiles").select("id").eq("id", privado.user.id);
    expect(data).toEqual([]);
  });

  test("un no-amigo SÍ ve un perfil público", async () => {
    const { data } = await privado.client.from("profiles").select("id").eq("id", extranio.user.id);
    expect(data).toHaveLength(1);
  });

  test("un amigo aceptado SÍ ve el perfil privado", async () => {
    // extranio manda solicitud, privado la acepta (privado es addressee… al revés:
    // insert lo hace el requester; el addressee la acepta)
    const { error: reqError } = await extranio.client.from("friendships").insert({
      requester_id: extranio.user.id,
      addressee_id: privado.user.id,
    });
    expect(reqError).toBeNull();

    const { error: acceptError } = await privado.client
      .from("friendships")
      .update({ status: "accepted" })
      .eq("addressee_id", privado.user.id)
      .eq("requester_id", extranio.user.id);
    expect(acceptError).toBeNull();

    const { data } = await extranio.client.from("profiles").select("id").eq("id", privado.user.id);
    expect(data).toHaveLength(1);
  });

  test("nadie puede editar el nickname (D4) ni el perfil ajeno", async () => {
    // nickname: la base revoca el update de esa columna
    const { error: nickError } = await privado.client
      .from("profiles")
      .update({ nickname: "hackeado" })
      .eq("id", privado.user.id);
    expect(nickError).not.toBeNull();

    // perfil ajeno: la policy de update lo filtra (0 filas afectadas, sin error)
    await extranio.client.from("profiles").update({ display_name: "pwned" }).eq("id", privado.user.id);
    const { data } = await admin.from("profiles").select("display_name").eq("id", privado.user.id).single();
    expect(data?.display_name).not.toBe("pwned");
  });
});
