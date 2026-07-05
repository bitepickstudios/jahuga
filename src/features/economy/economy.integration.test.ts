/**
 * Gate de Fase 5 (roadmap): invariantes de la economía contra el proyecto real.
 * balance = sum(ledger) siempre; el pozo paga exacto; nada se crea ni destruye.
 * Corre con `pnpm test:integration` (requiere migración 4 aplicada).
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

async function balanceOf(id: string): Promise<number> {
  const { data } = await admin.from("wallets").select("balance").eq("profile_id", id).single();
  return Number(data!.balance);
}

async function ledgerSum(id: string): Promise<number> {
  const { data } = await admin.from("coin_transactions").select("amount").eq("wallet_id", id);
  return (data ?? []).reduce((acc, t) => acc + Number(t.amount), 0);
}

describe("Economía (Fase 5)", () => {
  let a: { client: SupabaseClient; user: User };
  let b: { client: SupabaseClient; user: User };
  let matchId: string;

  beforeAll(async () => {
    a = await createTestUser(`eco_a_${stamp}`);
    b = await createTestUser(`eco_b_${stamp}`);
  }, 60_000);

  afterAll(async () => {
    if (matchId) await admin.from("matches").delete().eq("id", matchId);
    for (const u of users) await admin.auth.admin.deleteUser(u.id);
  }, 60_000);

  test("bono de bienvenida: 10.000 en wallet, asiento en el ledger y skin de regalo", async () => {
    expect(await balanceOf(a.user.id)).toBe(10_000);
    const { data: tx } = await admin
      .from("coin_transactions")
      .select("kind, amount")
      .eq("wallet_id", a.user.id);
    expect(tx).toEqual([{ kind: "welcome_bonus", amount: 10_000 }]);
    const { data: skins } = await admin
      .from("skin_ownership")
      .select("skin_id")
      .eq("profile_id", a.user.id);
    expect(skins).toEqual([{ skin_id: "albirroja" }]);
  });

  test("apuesta completa: escrow exacto, payout exacto, invariante intacta", async () => {
    const { data: match } = await admin
      .from("matches")
      .insert({
        game_id: "penales",
        challenger_id: a.user.id,
        opponent_id: b.user.id,
        mode: "async",
        status: "pending",
      })
      .select("id")
      .single();
    matchId = match!.id;
    await admin.from("wagers").insert({ match_id: matchId, amount: 1_500 });

    const { error: escrowError } = await admin.rpc("fn_escrow_wager", { p_match: matchId });
    expect(escrowError).toBeNull();
    expect(await balanceOf(a.user.id)).toBe(8_500);
    expect(await balanceOf(b.user.id)).toBe(8_500);

    // Idempotente: repetir el escrow no debita de nuevo
    await admin.rpc("fn_escrow_wager", { p_match: matchId });
    expect(await balanceOf(a.user.id)).toBe(8_500);

    const { error: settleError } = await admin.rpc("fn_settle_wager", {
      p_match: matchId,
      p_winner: a.user.id,
    });
    expect(settleError).toBeNull();
    expect(await balanceOf(a.user.id)).toBe(11_500); // ganó el pozo exacto
    expect(await balanceOf(b.user.id)).toBe(8_500);

    // Doble settle no paga dos veces
    await admin.rpc("fn_settle_wager", { p_match: matchId, p_winner: a.user.id });
    expect(await balanceOf(a.user.id)).toBe(11_500);

    // Invariante: balance = sum(ledger) para ambos
    expect(await balanceOf(a.user.id)).toBe(await ledgerSum(a.user.id));
    expect(await balanceOf(b.user.id)).toBe(await ledgerSum(b.user.id));
    // Y no se creó ni destruyó nada: el total del par es 2 × bienvenida
    expect((await balanceOf(a.user.id)) + (await balanceOf(b.user.id))).toBe(20_000);
  });

  test("escrow sin fondos suficientes falla y no toca ningún saldo", async () => {
    const { data: match } = await admin
      .from("matches")
      .insert({
        game_id: "penales",
        challenger_id: a.user.id,
        opponent_id: b.user.id,
        mode: "async",
        status: "pending",
      })
      .select("id")
      .single();
    await admin.from("wagers").insert({ match_id: match!.id, amount: 999_999 });

    const before = [await balanceOf(a.user.id), await balanceOf(b.user.id)];
    const { error } = await admin.rpc("fn_escrow_wager", { p_match: match!.id });
    expect(error).not.toBeNull();
    expect([await balanceOf(a.user.id), await balanceOf(b.user.id)]).toEqual(before);
    await admin.from("matches").delete().eq("id", match!.id);
  });

  test("transferencia entre usuarios respeta el límite diario", async () => {
    const { error } = await a.client.rpc("fn_transfer", { p_to: b.user.id, p_amount: 1_000 });
    expect(error).toBeNull();
    expect(await balanceOf(a.user.id)).toBe(10_500);
    expect(await balanceOf(b.user.id)).toBe(9_500);

    // Pasarse del límite diario (20.000) falla
    const { error: overError } = await a.client.rpc("fn_transfer", { p_to: b.user.id, p_amount: 19_500 });
    expect(overError).not.toBeNull();
    expect(await balanceOf(a.user.id)).toBe(10_500);
  });

  test("comprar una skin debita el precio exacto; recomprar y sin fondos fallan", async () => {
    // b tiene 9.500: no le alcanza para la azulgrana (25.000)
    const { error: poor } = await b.client.rpc("fn_buy_skin", { p_skin: "azulgrana" });
    expect(poor).not.toBeNull();

    await admin.rpc("fn_grant_coins", { p_profile: b.user.id, p_amount: 30_000, p_kind: "coupon" });
    const { error } = await b.client.rpc("fn_buy_skin", { p_skin: "azulgrana" });
    expect(error).toBeNull();
    expect(await balanceOf(b.user.id)).toBe(9_500 + 30_000 - 25_000);

    const { error: again } = await b.client.rpc("fn_buy_skin", { p_skin: "azulgrana" });
    expect(again).not.toBeNull();
    expect(await balanceOf(b.user.id)).toBe(await ledgerSum(b.user.id));
  });

  test("racha: primer check-in premia, el segundo del día no", async () => {
    const { data: first, error } = await a.client.rpc("fn_streak_checkin");
    expect(error).toBeNull();
    expect(first![0].days).toBe(1);
    expect(Number(first![0].reward)).toBe(500);

    const { data: second } = await a.client.rpc("fn_streak_checkin");
    expect(second![0].days).toBe(1);
    expect(Number(second![0].reward)).toBe(0);

    expect(await balanceOf(a.user.id)).toBe(await ledgerSum(a.user.id));
  });

  test("el cliente no puede escribir wallets ni ledger directo", async () => {
    const { error: w } = await a.client
      .from("wallets")
      .update({ balance: 999_999_999 })
      .eq("profile_id", a.user.id);
    const { data: after } = await a.client.from("wallets").select("balance").single();
    expect(Number(after?.balance)).not.toBe(999_999_999);
    void w;

    const { error: t } = await a.client
      .from("coin_transactions")
      .insert({ wallet_id: a.user.id, amount: 1_000_000, kind: "coupon" });
    expect(t).not.toBeNull();
  });
});
