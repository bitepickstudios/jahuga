"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Lobby", icon: HomeIcon },
  { href: "/amigos", label: "Amigos", icon: FriendsIcon },
  { href: "/grupo", label: "Grupo", icon: GroupIcon },
  { href: "/skins", label: "Skins", icon: ShirtIcon },
  { href: "/perfil", label: "Perfil", icon: ProfileIcon },
] as const;

/** Bottom nav fijo, 5 ítems, también en desktop (DESIGN.md §6). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ice/10 bg-night/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
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
              <Icon active={active} />
              <span
                className={`font-ui text-[11px] font-bold ${active ? "text-volt" : "text-ice/50"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const ON = "#C8F531";
const OFF = "rgba(234,240,255,0.5)";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1v-9.5Z" fill={active ? ON : OFF} />
    </svg>
  );
}

function FriendsIcon({ active }: { active: boolean }) {
  const c = active ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8.5" r="3.5" fill={c} />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0v1h-13v-1Z" fill={c} />
      <circle cx="17" cy="9.5" r="2.6" fill={c} fillOpacity="0.7" />
      <path d="M14.5 19.6a8 8 0 0 0-1.3-4.2 5 5 0 0 1 8.3 3.6v.6h-7Z" fill={c} fillOpacity="0.7" />
    </svg>
  );
}

function GroupIcon({ active }: { active: boolean }) {
  const c = active ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2.5 20 6v6c0 4.6-3.2 8-8 9.5C7.2 20 4 16.6 4 12V6l8-3.5Z" fill={c} fillOpacity="0.35" />
      <circle cx="12" cy="10" r="2.6" fill={c} />
      <path d="M7.5 16.2a4.8 4.8 0 0 1 9 0c-1.2 1.3-2.7 2.2-4.5 2.8-1.8-.6-3.3-1.5-4.5-2.8Z" fill={c} />
    </svg>
  );
}

function ShirtIcon({ active }: { active: boolean }) {
  const c = active ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 3.5 4 6l2 4 2-1v11.5h8V9l2 1 2-4-4-2.5a4 4 0 0 1-8 0Z"
        fill={c}
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" fill={c} />
      <path d="M4 20.5a8 8 0 0 1 16 0v.5H4v-.5Z" fill={c} />
    </svg>
  );
}
