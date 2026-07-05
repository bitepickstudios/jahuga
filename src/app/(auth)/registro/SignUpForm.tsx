"use client";

import { useActionState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { signUp, type AuthFormState } from "@/features/profiles/actions";

const INITIAL: AuthFormState = { error: null };

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField name="nickname" type="text" isRequired fullWidth>
        <Label>Nickname</Label>
        <Input placeholder="tu_apodo" autoComplete="username" />
      </TextField>
      <TextField name="email" type="email" isRequired fullWidth>
        <Label>Correo</Label>
        <Input placeholder="vos@ejemplo.com" autoComplete="email" />
      </TextField>
      <TextField name="password" type="password" isRequired fullWidth>
        <Label>Contraseña</Label>
        <Input placeholder="Mínimo 8, con letra y número" autoComplete="new-password" />
      </TextField>
      <TextField name="confirm" type="password" isRequired fullWidth>
        <Label>Repetir contraseña</Label>
        <Input autoComplete="new-password" />
      </TextField>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.info && <p className="text-sm text-gold">{state.info}</p>}

      <Button type="submit" variant="primary" size="lg" fullWidth className="min-h-12" isDisabled={pending}>
        {pending ? "Creando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
