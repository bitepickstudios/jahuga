"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import type { Direction, KickPower, SaveTiming } from "../engine";
import { GoalPicker } from "./GoalPicker";

/** Borrador del movimiento de la ronda mientras el jugador elige. */
export interface Draft {
  kickDirection: Direction | null;
  power: KickPower;
  saveDirection: Direction | null;
  timing: SaveTiming;
}

export const EMPTY_DRAFT: Draft = {
  kickDirection: null,
  power: "placed",
  saveDirection: null,
  timing: "wait",
};

/** Selección de la ronda: primero pateás, después atajás. Todo con el pulgar. */
export function PickRound({
  playerName,
  round,
  draft,
  onChange,
  onConfirm,
  confirmDisabled = false,
}: {
  playerName: string;
  round: number;
  draft: Draft;
  onChange: (draft: Draft) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  const [step, setStep] = useState<"kick" | "save">("kick");

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-ice/50">
          Penal {round} · {playerName}
        </p>
        <h2 className="font-display text-3xl uppercase text-ice">
          {step === "kick" ? "¿Dónde pateás?" : "¿Dónde te tirás?"}
        </h2>
      </header>

      {step === "kick" ? (
        <>
          <GoalPicker
            selected={draft.kickDirection}
            onSelect={(d) => onChange({ ...draft, kickDirection: d })}
          />
          <OptionToggle
            options={[
              { value: "placed", label: "Colocado", hint: "seguro, pero te pueden leer" },
              { value: "strong", label: "Fuerte", hint: "imparable si espera, 15% de errarlo" },
            ]}
            selected={draft.power}
            onSelect={(power) => onChange({ ...draft, power: power as KickPower })}
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-12 max-w-sm"
            isDisabled={draft.kickDirection === null}
            onPress={() => setStep("save")}
          >
            Listo, ahora atajá
          </Button>
        </>
      ) : (
        <>
          <GoalPicker
            selected={draft.saveDirection}
            onSelect={(d) => onChange({ ...draft, saveDirection: d })}
          />
          <OptionToggle
            options={[
              { value: "wait", label: "Esperar", hint: "reaccionás a lo colocado" },
              { value: "dive_early", label: "Adelantarse", hint: "le ganás al fuerte, el centro te mata" },
            ]}
            selected={draft.timing}
            onSelect={(timing) => onChange({ ...draft, timing: timing as SaveTiming })}
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-12 max-w-sm"
            isDisabled={draft.saveDirection === null || confirmDisabled}
            onPress={onConfirm}
          >
            Confirmar ronda
          </Button>
        </>
      )}
    </div>
  );
}

function OptionToggle({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string; hint: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected === option.value}
          onClick={() => onSelect(option.value)}
          className={`min-h-16 rounded-xl border px-3 py-2 text-left transition-colors ${
            selected === option.value
              ? "border-ice bg-ice/10"
              : "border-ice/20 active:bg-ice/5"
          }`}
        >
          <span className="block font-semibold text-ice">{option.label}</span>
          <span className="block text-xs text-ice/50">{option.hint}</span>
        </button>
      ))}
    </div>
  );
}
