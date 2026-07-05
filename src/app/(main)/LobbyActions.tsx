"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Swords } from "lucide-react";
import { MinigamePickerModal } from "@/components/MinigamePickerModal";

/** Botones Jugar (abre el picker) + Retar. Client por el estado del modal. */
export function LobbyActions() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-[240px] flex-col items-stretch gap-3">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="group relative flex min-h-14 items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-b from-[#d9ff4a] to-volt px-6 font-ui text-xl font-extrabold text-volt-ink shadow-[0_5px_0_#7fa30f,0_8px_20px_rgba(200,245,49,0.35)] transition-all active:translate-y-1 active:shadow-[0_2px_0_#7fa30f]"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
        <span className="relative flex size-7 items-center justify-center rounded-full bg-volt-ink/15">
          <Play size={18} fill="currentColor" />
        </span>
        <span className="relative">JUGAR</span>
      </button>

      <Link
        href="/jugar/retar"
        className="group flex min-h-12 items-center justify-center gap-2 rounded-xl border border-volt/25 bg-navy/80 px-6 font-ui text-base font-bold text-ice shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur transition-colors hover:border-volt/50 active:bg-navy-raised/80"
      >
        <Swords size={18} className="text-volt" />
        RETAR
      </Link>

      <MinigamePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
