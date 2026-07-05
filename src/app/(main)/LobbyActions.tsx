"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Swords } from "lucide-react";
import { MinigamePickerModal } from "@/components/MinigamePickerModal";

/** Botones Jugar (abre el picker) + Retar. Client por el estado del modal. */
export function LobbyActions() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-stretch gap-3 lg:ml-auto lg:max-w-[300px]">
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

      {/* Borde en degradé: wrapper p-px con gradiente + interior navy */}
      <Link
        href="/jugar/retar"
        className="group relative rounded-xl bg-gradient-to-r from-volt/50 via-ice/15 to-volt/50 p-px shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-shadow hover:shadow-[0_6px_22px_rgba(200,245,49,0.25)]"
      >
        <span className="relative flex min-h-12 items-center justify-center gap-2.5 overflow-hidden rounded-[11px] bg-gradient-to-b from-navy-raised to-navy px-6 font-ui text-base font-extrabold uppercase tracking-wide text-ice">
          {/* Sheen diagonal en hover */}
          <span className="pointer-events-none absolute -inset-y-4 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/10 opacity-0 transition-all duration-500 group-hover:left-[120%] group-hover:opacity-100" />
          <span className="flex size-7 items-center justify-center rounded-lg bg-volt/15 text-volt">
            <Swords size={17} />
          </span>
          Retar
        </span>
      </Link>

      <MinigamePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
