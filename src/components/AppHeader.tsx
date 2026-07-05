"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus } from "lucide-react";
import { formatCoins } from "@/features/economy/config";
import { BuyCoinsModal } from "./BuyCoinsModal";

const NAV = [
  { href: "/", label: "Lobby" },
  { href: "/amigos", label: "Amigos" },
  { href: "/grupo", label: "Grupos" },
  { href: "/skins", label: "Tienda" },
  { href: "/perfil", label: "Perfil" },
] as const;

/** Header del shell (DESIGN.md §6): overlay transparente · logo · nav-box · coins+ · campana · avatar. */
export function AppHeader({
  profile,
  pendingCount = 0,
  balance = null,
}: {
  profile: { nickname: string; photo_url: string | null } | null;
  pendingCount?: number;
  balance?: number | null;
}) {
  const pathname = usePathname();
  const [buyOpen, setBuyOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="relative mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-16">
        <Link href="/" aria-label="Jahuga — inicio" className="shrink-0">
          <Image src="/assets/logo.v2.svg" alt="Jahuga" width={112} height={28} priority className="h-5 w-auto lg:h-7" />
        </Link>

        {profile && (
          <nav
            aria-label="Secciones"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-2xl border border-ice/10 bg-navy/70 p-1.5 backdrop-blur lg:flex"
          >
            {NAV.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-4 py-2 font-ui text-sm font-bold transition-colors ${
                    active ? "bg-volt/15 text-volt" : "text-ice/60 hover:bg-ice/5 hover:text-ice"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {profile ? (
          <div className="flex shrink-0 items-center gap-2">
            {/* Coin pill + botón de compra (mock, WhatsApp) */}
            <div className="flex h-10 items-center gap-1.5 rounded-xl border border-ice/10 bg-navy/80 pl-1.5 pr-1.5 backdrop-blur">
              <Link href="/wallet" aria-label="Tu wallet de Coins" className="flex items-center gap-1.5">
                <Image src="/assets/jahuga-coin-transparent.png" alt="" width={24} height={24} />
                <span className="font-ui text-sm font-extrabold text-ice">
                  {balance === null ? "—" : formatCoins(balance)}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setBuyOpen(true)}
                aria-label="Comprar Coins"
                className="flex size-7 items-center justify-center rounded-lg bg-volt text-volt-ink transition-transform active:scale-90"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>

            <Link
              href="/partidas"
              aria-label={`Mis partidas${pendingCount ? `: ${pendingCount} retos pendientes` : ""}`}
              className="relative flex size-10 items-center justify-center rounded-xl border border-ice/10 bg-navy/80 backdrop-blur"
            >
              <Bell size={18} className="text-ice/90" />
              {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-danger font-ui text-[11px] font-extrabold text-ice">
                  {pendingCount}
                </span>
              )}
            </Link>

            <Link href="/perfil" aria-label="Mi perfil" className="relative">
              {profile.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_url}
                  alt=""
                  className="size-10 rounded-full border-2 border-ice/20 object-cover"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full border-2 border-ice/20 bg-navy-raised font-ui text-sm font-extrabold uppercase text-ice">
                  {profile.nickname.slice(0, 2)}
                </span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-night bg-online" />
            </Link>

            <BuyCoinsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-10 shrink-0 items-center rounded-xl border border-ice/15 bg-navy/80 px-4 font-ui text-sm font-bold text-ice active:bg-navy-raised"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
