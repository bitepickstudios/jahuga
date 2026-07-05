"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Brain, Lock, Swords, Trophy } from "lucide-react";
import { Modal } from "./Modal";

interface MockGame {
  name: string;
  Icon: typeof Brain;
  hue: string;
}

const MOCKS: MockGame[] = [
  { name: "Trivia", Icon: Brain, hue: "from-[#1a2f6e]" },
  { name: "Cartas RPG", Icon: Swords, hue: "from-[#3a1a6e]" },
  { name: "Modo Torneo", Icon: Trophy, hue: "from-[#6e4a1a]" },
];

/** Elegir minijuego — rail horizontal. Penales activo; el resto bloqueado. */
export function MinigamePickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  function pickPenales() {
    onClose();
    router.push("/jugar");
  }

  return (
    <Modal open={open} onClose={onClose} title="Elegí tu minijuego" size="lg">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-5">
        <button
          type="button"
          onClick={pickPenales}
          className="relative w-60 shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-volt text-left shadow-[0_0_24px_rgba(200,245,49,0.25)]"
        >
          <Image
            src="/assets/jahuga__game_bg_penaltys.png"
            alt=""
            width={512}
            height={320}
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/25 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-volt px-3 py-1 font-ui text-[11px] font-extrabold uppercase tracking-wide text-volt-ink">
            Destacado
          </span>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="font-ui text-lg font-extrabold text-ice">Tandas de Penales</p>
            <p className="text-xs text-ice/60">Leé al rival. 5 penales por lado.</p>
          </div>
        </button>

        {MOCKS.map(({ name, Icon, hue }) => (
          <div
            key={name}
            className={`relative flex h-44 w-60 shrink-0 snap-start flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-ice/10 bg-gradient-to-br ${hue} to-night`}
          >
            <span className="absolute left-3 top-3 rounded-full bg-ice/10 px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-wide text-ice/70">
              Próximamente
            </span>
            <Icon className="text-ice/50" size={40} />
            <span className="flex size-8 items-center justify-center rounded-full bg-night/60 text-ice/60">
              <Lock size={16} />
            </span>
            <p className="font-ui text-base font-extrabold text-ice/70">{name}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
