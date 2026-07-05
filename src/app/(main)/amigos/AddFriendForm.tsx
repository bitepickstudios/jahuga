"use client";

import { useActionState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { sendFriendRequest, type FriendFormState } from "@/features/friends/actions";

const INITIAL: FriendFormState = { error: null };

export function AddFriendForm() {
  const [state, formAction, pending] = useActionState(sendFriendRequest, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <TextField name="nickname" type="text" isRequired fullWidth aria-label="Nickname">
          <Label className="sr-only">Nickname</Label>
          <Input placeholder="@nickname" autoCapitalize="none" autoComplete="off" />
        </TextField>
        <Button type="submit" variant="primary" isDisabled={pending} className="min-h-11 shrink-0">
          {pending ? "..." : "Agregar"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="text-sm text-volt">{state.ok}</p>}
    </form>
  );
}
