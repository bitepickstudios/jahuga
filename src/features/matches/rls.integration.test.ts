/**
 * Gate de Fase 3 (roadmap): el commit oculto.
 * Un jugador NO puede leer los movimientos del rival antes de commitear los suyos.
 * Corre contra el proyecto real: `pnpm test:integration`.
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
  const { error: signInError } = await client.auth.signInWithPassword({
    email: `${nickname}@test.lobby`,
    password: PASSWORD,
  });
  if (signInError) throw signInError;
  return { client, user: data.user };
}

const MOVE = { kick: { direction: "left", power: "placed" }, save: { direction: "left", timing: "wait" } };

describe("RLS de matches y match_moves (Fase 3 — commit oculto)", () => {
  let a: { client: SupabaseClient; user: User };
  let b: { client: SupabaseClient; user: User };
  let c: { client: SupabaseClient; user: User };
  let matchId: string;

  beforeAll(async () => {
    a = await createTestUser(`rls_m_a_${stamp}`);
    b = await createTestUser(`rls_m_b_${stamp}`);
    c = await createTestUser(`rls_m_c_${stamp}`);
    const { data, error } = await admin
      .from("matches")
      .insert({
        game_id: "penales",
        challenger_id: a.user.id,
        opponent_id: b.user.id,
        mode: "async",
        status: "active",
        accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    matchId = data.id;
  }, 60_000);

  afterAll(async () => {
    await admin.from("matches").delete().eq("id", matchId);
    for (const u of users) await admin.auth.admin.deleteUser(u.id);
  }, 60_000);

  test("un tercero no ve la partida", async () => {
    const { data } = await c.client.from("matches").select("id").eq("id", matchId);
    expect(data).toEqual([]);
  });

  test("los participantes ven la partida", async () => {
    const { data } = await b.client.from("matches").select("id").eq("id", matchId);
    expect(data).toHaveLength(1);
  });

  test("un jugador no puede insertar movimientos directo (solo server)", async () => {
    const { error } = await a.client.from("match_moves").insert({
      match_id: matchId,
      player_id: a.user.id,
      round: 1,
      move: MOVE,
    });
    expect(error).not.toBeNull();
  });

  test("commit oculto: B no ve el movimiento de A hasta commitear el suyo", async () => {
    // A commitea la ronda 1 (vía service role, como hace la Server Action)
    await admin.from("match_moves").insert({ match_id: matchId, player_id: a.user.id, round: 1, move: MOVE });

    const { data: bSees } = await b.client.from("match_moves").select("id").eq("match_id", matchId);
    expect(bSees).toEqual([]); // nada del rival

    const { data: aSees } = await a.client.from("match_moves").select("id").eq("match_id", matchId);
    expect(aSees).toHaveLength(1); // lo propio sí

    // B commitea → ronda completa → ambos ven ambos movimientos
    await admin.from("match_moves").insert({ match_id: matchId, player_id: b.user.id, round: 1, move: MOVE });

    const { data: bSeesNow } = await b.client.from("match_moves").select("id").eq("match_id", matchId);
    expect(bSeesNow).toHaveLength(2);
  });

  test("ronda incompleta posterior sigue oculta aunque la anterior esté revelada", async () => {
    await admin.from("match_moves").insert({ match_id: matchId, player_id: a.user.id, round: 2, move: MOVE });

    const { data: bSees } = await b.client
      .from("match_moves")
      .select("id, round")
      .eq("match_id", matchId)
      .eq("round", 2);
    expect(bSees).toEqual([]); // la ronda 2 de A sigue oculta para B
  });

  test("un tercero no ve ningún movimiento", async () => {
    const { data } = await c.client.from("match_moves").select("id").eq("match_id", matchId);
    expect(data).toEqual([]);
  });
});
