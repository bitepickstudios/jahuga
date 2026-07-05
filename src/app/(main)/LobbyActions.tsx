"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Swords } from "lucide-react";
import { MinigamePickerModal } from "@/components/MinigamePickerModal";

/** Botones Jugar (abre el picker) + Retar. Client por el estado del modal. */
export function LobbyActions() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="group relative flex min-h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-b from-[#d9ff4a] to-volt font-ui text-2xl font-extrabold text-volt-ink shadow-[0_6px_0_#7fa30f,0_10px_24px_rgba(200,245,49,0.35)] transition-all active:translate-y-1 active:shadow-[0_2px_0_#7fa30f]"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
        <span className="relative flex size-8 items-center justify-center rounded-full bg-volt-ink/15">
          <Play size={20} fill="currentColor" />
        </span>
        <span className="relative">JUGAR</span>
      </button>

      <Link
        href="/jugar/retar"
        className="group flex min-h-14 items-center justify-center gap-2.5 rounded-2xl border border-volt/25 bg-navy/80 font-ui text-lg font-bold text-ice shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur transition-colors hover:border-volt/50 active:bg-navy-raised/80"
      >
        <Swords size={20} className="text-volt" />
        RETAR
      </Link>

      <MinigamePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
