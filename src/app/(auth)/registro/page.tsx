import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Crear cuenta — Jahuga" };

export default function RegistroPage() {
  return (
    <>
      <header className="text-center">
        <h1 className="font-ui text-3xl font-extrabold text-ice">Crear cuenta</h1>
        <p className="mt-2 text-ice/60">Elegí bien tu nickname: no se cambia.</p>
      </header>
      <SignUpForm />
      <p className="text-center text-sm text-ice/50">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-volt underline underline-offset-4">
          Iniciá sesión
        </Link>
      </p>
    </>
  );
}
