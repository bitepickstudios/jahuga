"use client";

import { useActionState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { signIn, type AuthFormState } from "@/features/profiles/actions";

const INITIAL: AuthFormState = { error: null };

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField name="email" type="email" isRequired fullWidth>
        <Label>Correo</Label>
        <Input autoComplete="email" />
      </TextField>
      <TextField name="password" type="password" isRequired fullWidth>
        <Label>Contraseña</Label>
        <Input autoComplete="current-password" />
      </TextField>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" variant="primary" size="lg" fullWidth className="min-h-12" isDisabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
