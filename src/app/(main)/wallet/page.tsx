import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profiles/queries";
import { getBalance, getStreak, getTransactions } from "@/features/economy/queries";
import { getFriends } from "@/features/friends/queries";
import { ECONOMY, formatCoins } from "@/features/economy/config";
import { TransferForm } from "./TransferForm";

export const metadata: Metadata = { title: "Wallet — Jahuga" };

const KIND_LABEL: Record<string, string> = {
  welcome_bonus: "🎁 Bono de bienvenida",
  wager_escrow: "⚔️ Apuesta (escrow)",
  wager_payout: "🏆 Pozo ganado",
  wager_refund: "↩️ Apuesta devuelta",
  transfer_in: "📥 Transferencia recibida",
  transfer_out: "📤 Transferencia enviada",
  streak_reward: "🔥 Racha diaria",
  mission_reward: "🎯 Misión",
  coupon: "🎟️ Cupón",
  skin_purchase: "👕 Skin comprada",
  admin_adjustment: "🛠️ Ajuste",
};

export default async function WalletPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  const [balance, streak, transactions, friends] = await Promise.all([
    getBalance(),
    getStreak(),
    getTransactions(30),
    getFriends(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 lg:max-w-2xl">
      <section className="flex flex-col items-center gap-1 rounded-2xl border border-ice/10 bg-navy/80 p-6 text-center">
        <Image src="/assets/jahuga-coin-transparent.png" alt="" width={56} height={56} />
        <p className="font-ui text-5xl font-extrabold text-ice">{formatCoins(balance ?? 0)}</p>
        <p className="text-sm text-ice/50">Coins</p>
        {streak && streak.current_days > 0 && (
          <p className="mt-2 rounded-full bg-ice/10 px-3 py-1 font-ui text-xs font-bold text-gold">
            🔥 Racha de {streak.current_days} {streak.current_days === 1 ? "día" : "días"}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-ice/10 bg-navy/80 p-4">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Transferir a un amigo
        </h2>
        <p className="mb-3 text-xs text-ice/40">
          Máximo {formatCoins(ECONOMY.transferDailyLimit)} por día.
        </p>
        {friends.length === 0 ? (
          <p className="text-sm text-ice/40">Agregá amigos para poder transferir.</p>
        ) : (
          <TransferForm friends={friends.map((f) => ({ id: f.id, label: f.display_name ?? `@${f.nickname}` }))} />
        )}
      </section>

      <section className="rounded-2xl border border-ice/10 bg-navy/80 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ice/50">
          Movimientos
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-ice/40">Todavía no hay movimientos.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ice/80">{KIND_LABEL[t.kind] ?? t.kind}</span>
                <span
                  className={`shrink-0 font-ui font-extrabold ${t.amount > 0 ? "text-volt" : "text-ice/60"}`}
                >
                  {t.amount > 0 ? "+" : ""}
                  {formatCoins(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
