"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Shield, ShoppingBag, User, type LucideIcon } from "lucide-react";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Lobby", icon: Home },
  { href: "/amigos", label: "Amigos", icon: Users },
  { href: "/grupo", label: "Grupos", icon: Shield },
  { href: "/skins", label: "Tienda", icon: ShoppingBag },
  { href: "/perfil", label: "Perfil", icon: User },
];

/** Bottom nav fijo, solo mobile (desktop usa el nav del header — DESIGN.md §6). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ice/10 bg-night/90 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid h-16 w-full max-w-xl grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center gap-0.5"
            >
              {active && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-volt" />}
              <Icon size={22} className={active ? "text-volt" : "text-ice/50"} />
              <span className={`font-ui text-[11px] font-bold ${active ? "text-volt" : "text-ice/50"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
