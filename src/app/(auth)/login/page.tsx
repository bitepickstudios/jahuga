import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Entrar — Lobby" };

export default function LoginPage() {
  return (
    <>
      <header className="text-center">
        <h1 className="font-display text-4xl uppercase text-chalk">Entrar</h1>
        <p className="mt-2 text-chalk/60">El lobby te espera.</p>
      </header>
      <SignInForm />
      <p className="text-center text-sm text-chalk/50">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-albirroja underline underline-offset-4">
          Creá una
        </Link>
      </p>
    </>
  );
}
