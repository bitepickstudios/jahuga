"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { challengeUser, type ChallengeFormState } from "@/features/matches/actions";

const INITIAL: ChallengeFormState = { error: null };

export function ChallengeForm() {
  const [state, formAction, pending] = useActionState(challengeUser, INITIAL);
  const [mode, setMode] = useState<"live" | "async">("live");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField name="nickname" type="text" isRequired fullWidth>
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
            className={`min-h-16 rounded-md border px-3 py-2 text-left transition-colors ${
              mode === option.value ? "border-ice bg-ice/10" : "border-ice/20 active:bg-ice/5"
            }`}
          >
            <span className="block font-semibold text-ice">{option.label}</span>
            <span className="block text-xs text-ice/50">{option.hint}</span>
          </button>
        ))}
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" variant="primary" size="lg" fullWidth className="min-h-12" isDisabled={pending}>
        {pending ? "Creando reto..." : "Mandar reto"}
      </Button>
    </form>
  );
}
