import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Entrar — Jahuga" };

export default function LoginPage() {
  return (
    <>
      <header className="text-center">
        <h1 className="font-ui text-3xl font-extrabold text-ice">Entrar</h1>
        <p className="mt-2 text-ice/60">El lobby te espera.</p>
      </header>
      <SignInForm />
      <p className="text-center text-sm text-ice/50">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-volt underline underline-offset-4">
          Creá una
        </Link>
      </p>
    </>
  );
}
