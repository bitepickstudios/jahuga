"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { challengeUser, type ChallengeFormState } from "@/features/matches/actions";
import { ECONOMY, formatCoins } from "@/features/economy/config";

const INITIAL: ChallengeFormState = { error: null };

export function ChallengeForm({ defaultNickname = "" }: { defaultNickname?: string }) {
  const [state, formAction, pending] = useActionState(challengeUser, INITIAL);
  const [mode, setMode] = useState<"live" | "async">("live");
  const [amount, setAmount] = useState(0);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField name="nickname" type="text" isRequired fullWidth defaultValue={defaultNickname}>
        <Label>Nickname del rival</Label>
        <Input placeholder="@su_apodo" autoComplete="off" autoCapitalize="none" />
      </TextField>

      <input type="hidden" name="mode" value={mode} />
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { value: "live", label: "En vivo", hint: "los dos conectados, penal a penal" },
            { value: "async", label: "Cuando puedan", hint: "cada uno juega a su ritmo, 48 h" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={mode === option.value}
            onClick={() => setMode(option.value)}
            className={`min-h-16 rounded-xl border px-3 py-2 text-left transition-colors ${
              mode === option.value ? "border-ice bg-ice/10" : "border-ice/20 active:bg-ice/5"
            }`}
          >
            <span className="block font-semibold text-ice">{option.label}</span>
            <span className="block text-xs text-ice/50">{option.hint}</span>
          </button>
        ))}
      </div>

      <input type="hidden" name="amount" value={amount} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ice/80">Apuesta (opcional)</legend>
        <div className="grid grid-cols-4 gap-2">
          {[0, ...ECONOMY.wagerPresets].map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={amount === preset}
              onClick={() => setAmount(preset)}
              className={`min-h-11 rounded-xl border px-2 font-ui text-sm font-bold transition-colors ${
                amount === preset
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-ice/20 text-ice/70 active:bg-ice/5"
              }`}
            >
              {preset === 0 ? "Amistoso" : `${formatCoins(preset)}`}
            </button>
          ))}
        </div>
        {amount > 0 && (
          <p className="text-xs text-ice/40">
            Cada uno pone {formatCoins(amount)}; el ganador se lleva {formatCoins(amount * 2)}.
          </p>
        )}
      </fieldset>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" variant="primary" size="lg" fullWidth className="min-h-12" isDisabled={pending}>
        {pending ? "Creando reto..." : amount > 0 ? `Retar por ${formatCoins(amount)} Coins` : "Mandar reto"}
      </Button>
    </form>
  );
}
