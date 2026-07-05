"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { buySkin, equipSkin } from "@/features/economy/actions";
import { formatCoins } from "@/features/economy/config";
import type { Skin } from "@/features/economy/queries";
import { PlayerAvatar } from "@/features/avatars/PlayerAvatar";

export function SkinGrid({
  skins,
  photoUrl,
  balance,
}: {
  skins: Skin[];
  photoUrl: string | null;
  balance: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onBuy(id: string) {
    setBusy(id);
    setError(null);
    const result = await buySkin(id);
    if (result.error) setError(result.error);
    setBusy(null);
    router.refresh();
  }

  async function onEquip(id: string) {
    setBusy(id);
    setError(null);
    const result = await equipSkin(id);
    if (result.error) setError(result.error);
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {skins.map((s) => (
          <div
            key={s.id}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-3 ${
              s.equipped ? "border-volt bg-navy/80 shadow-[0_0_16px_rgba(200,245,49,0.2)]" : "border-ice/10 bg-navy/80"
            }`}
          >
            <PlayerAvatar photoUrl={photoUrl} skinId={s.id} className="h-32 w-24" />
            <p className="font-ui font-extrabold text-ice">{s.name}</p>
            {s.equipped ? (
              <span className="rounded-full bg-volt px-3 py-1 font-ui text-[11px] font-extrabold uppercase text-volt-ink">
                Equipada
              </span>
            ) : s.owned ? (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                isDisabled={busy !== null}
                onPress={() => onEquip(s.id)}
              >
                {busy === s.id ? "..." : "Equipar"}
              </Button>
            ) : s.price_coins === null ? (
              <span className="text-xs text-ice/40">De regalo</span>
            ) : (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                isDisabled={busy !== null || balance < s.price_coins}
                onPress={() => onBuy(s.id)}
              >
                {busy === s.id ? "..." : `🪙 ${formatCoins(s.price_coins)}`}
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-ice/40">Tenés {formatCoins(balance)} Coins.</p>
    </>
  );
}
