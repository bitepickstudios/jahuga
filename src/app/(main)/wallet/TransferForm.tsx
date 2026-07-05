"use client";

import { useActionState } from "react";
import { Button } from "@heroui/react";
import { transferCoins, type EconomyFormState } from "@/features/economy/actions";

const INITIAL: EconomyFormState = { error: null };

export function TransferForm({ friends }: { friends: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(transferCoins, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <select
        name="to"
        required
        defaultValue=""
        aria-label="Amigo destinatario"
        className="min-h-11 rounded-xl border border-ice/15 bg-night/50 px-3 text-ice [color-scheme:dark]"
      >
        <option value="" disabled>
          Elegí un amigo
        </option>
        {friends.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          type="number"
          name="amount"
          min={1}
          step={1}
          required
          placeholder="Monto"
          aria-label="Monto a transferir"
          className="min-h-11 w-full flex-1 rounded-xl border border-ice/15 bg-night/50 px-3 text-ice placeholder:text-ice/30"
        />
        <Button type="submit" variant="primary" isDisabled={pending} className="min-h-11 shrink-0 rounded-xl">
          {pending ? "..." : "Enviar"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="text-sm text-volt">{state.ok}</p>}
    </form>
  );
}
