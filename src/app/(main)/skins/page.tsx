import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gamepad2, Lock, Shirt, Trophy } from "lucide-react";
import { getOwnProfile } from "@/features/profiles/queries";
import { getBalance, getSkins } from "@/features/economy/queries";
import { SkinGrid } from "./SkinGrid";

export const metadata: Metadata = { title: "Tienda — Jahuga" };

const CANJES = [
  { name: "PlayStation 5", Icon: Gamepad2 },
  { name: "Juegos AAA", Icon: Trophy },
  { name: "Ropa de auspiciantes", Icon: Shirt },
];

export default async function TiendaPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  const [skins, balance] = await Promise.all([getSkins(), getBalance()]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-6 lg:max-w-2xl">
      <header>
        <h1 className="font-ui text-3xl font-extrabold text-ice">Tienda</h1>
        <p className="mt-1 text-ice/60">
          Equipá skins con Coins y, pronto, canjealas por premios reales.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-ui text-lg font-extrabold text-ice">Skins</h2>
        <SkinGrid skins={skins} photoUrl={profile.photo_url} balance={balance ?? 0} />
      </section>

      <section>
        <h2 className="mb-1 font-ui text-lg font-extrabold text-ice">Canjes</h2>
        <p className="mb-3 text-sm text-ice/50">
          Cambiá tus Coins por premios reales de nuestros auspiciantes. Muy pronto.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {CANJES.map(({ name, Icon }) => (
            <div
              key={name}
              className="relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-ice/10 bg-gradient-to-br from-navy-raised to-night p-4 text-center"
            >
              <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-night/60 text-ice/60">
                <Lock size={14} />
              </span>
              <Icon size={34} className="text-ice/50" />
              <p className="font-ui text-xs font-bold text-ice/70">{name}</p>
              <span className="rounded-full bg-ice/10 px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide text-ice/60">
                Próximamente
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
