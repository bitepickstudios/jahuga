import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Crear cuenta — Lobby" };

export default function RegistroPage() {
  return (
    <>
      <header className="text-center">
        <h1 className="font-display text-4xl uppercase text-chalk">Crear cuenta</h1>
        <p className="mt-2 text-chalk/60">Elegí bien tu nickname: no se cambia.</p>
      </header>
      <SignUpForm />
      <p className="text-center text-sm text-chalk/50">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-albirroja underline underline-offset-4">
          Iniciá sesión
        </Link>
      </p>
    </>
  );
}
