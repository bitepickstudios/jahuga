import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Invitación — Jahuga" };

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const admin = createAdminClient();
  const { data: owner } = await admin
    .from("profiles")
    .select("id, nickname, display_name, photo_url")
    .eq("invite_code", code)
    .maybeSingle();

  if (!owner) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl">🔗</p>
        <h1 className="font-ui text-2xl font-extrabold text-ice">Link inválido</h1>
        <p className="text-ice/60">Esta invitación no existe o venció. Pedile a tu amigo el link de nuevo.</p>
        <Link href="/" className="font-ui font-bold text-volt">Ir a Jahuga ›</Link>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (user.id !== owner.id) {
      // Solicitud del visitante hacia el dueño del link; duplicados se ignoran
      await supabase
        .from("friendships")
        .insert({ requester_id: user.id, addressee_id: owner.id })
        .select()
        .maybeSingle();
    }
    redirect("/amigos");
  }

  const ownerName = owner.display_name ?? `@${owner.nickname}`;
  return (
    <main className="bg-stadium flex min-h-dvh flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <Image src="/assets/logo.svg" alt="Jahuga" width={200} height={51} priority />
      {owner.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={owner.photo_url} alt="" className="size-24 rounded-full border-2 border-volt object-cover" />
      ) : (
        <span className="flex size-24 items-center justify-center rounded-full border-2 border-volt bg-navy text-4xl">⚽</span>
      )}
      <h1 className="font-ui text-3xl font-extrabold text-ice">{ownerName} te invita a jugar</h1>
      <p className="max-w-xs text-ice/60">
        Creá tu cuenta y quedan conectados como amigos para retarse cuando quieran.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/registro"
          className="flex min-h-14 items-center justify-center rounded-2xl bg-volt font-ui text-xl font-extrabold text-volt-ink shadow-[0_5px_0_rgba(0,0,0,0.4)] transition-transform active:translate-y-0.5 active:shadow-none"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="flex min-h-12 items-center justify-center rounded-xl border border-ice/15 bg-navy/80 font-ui font-bold text-ice active:bg-navy-raised/80"
        >
          Ya tengo cuenta
        </Link>
      </div>
    </main>
  );
}
