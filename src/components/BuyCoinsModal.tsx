"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Coins } from "lucide-react";
import { Modal } from "./Modal";
import { formatCoins } from "@/features/economy/config";

const WHATSAPP = "595972137968";
const PRESETS = [10_000, 25_000, 50_000, 100_000];
const STEP = 5_000;
const MIN = 5_000;

/**
 * Compra de Coins — MOCK. Arma un mensaje de WhatsApp al admin; la acreditación
 * es manual (ver D8 en docs/decisiones-abiertas.md: no hay rail de pagos).
 * Ratio 1:1 con guaraníes.
 */
export function BuyCoinsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(50_000);
  const waText = encodeURIComponent(`Hola! quiero comprar J ${formatCoins(amount)} coins`);
  const waUrl = `https://wa.me/${WHATSAPP}?text=${waText}`;

  return (
    <Modal open={open} onClose={onClose} title="Comprar Coins" size="sm">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Restar"
            onClick={() => setAmount((a) => Math.max(MIN, a - STEP))}
            className="flex size-11 items-center justify-center rounded-full border border-ice/15 text-ice active:bg-ice/10"
          >
            <Minus size={20} />
          </button>
          <div className="flex min-w-40 items-center justify-center gap-2 rounded-2xl bg-night/60 px-4 py-3">
            <Image src="/assets/jahuga-coin-transparent.png" alt="" width={28} height={28} />
            <span className="font-ui text-2xl font-extrabold text-ice">{formatCoins(amount)}</span>
          </div>
          <button
            type="button"
            aria-label="Sumar"
            onClick={() => setAmount((a) => a + STEP)}
            className="flex size-11 items-center justify-center rounded-full border border-ice/15 text-ice active:bg-ice/10"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={amount === p}
              onClick={() => setAmount(p)}
              className={`min-h-10 rounded-xl border px-2 font-ui text-sm font-bold transition-colors ${
                amount === p ? "border-volt bg-volt/15 text-volt" : "border-ice/15 text-ice/70 active:bg-ice/5"
              }`}
            >
              {formatCoins(p / 1000)}k
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-ice/60">
          {formatCoins(amount)} Coins = <span className="font-bold text-ice">{formatCoins(amount)} Gs</span>
        </p>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-volt font-ui text-lg font-extrabold text-volt-ink shadow-[0_4px_0_rgba(0,0,0,0.35)] transition-transform active:translate-y-0.5 active:shadow-none"
        >
          <Coins size={20} /> Pedir por WhatsApp
        </a>
        <p className="text-center text-xs text-ice/40">
          Coordinás el pago por WhatsApp y un admin te acredita las Coins.
        </p>
      </div>
    </Modal>
  );
}
