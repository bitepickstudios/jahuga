import Image from "next/image";
import Link from "next/link";
import { formatCoins } from "@/features/economy/config";

/** Header del shell (DESIGN.md §6): logo, coins, campana, avatar. */
export function AppHeader({
  profile,
  pendingCount = 0,
  balance = null,
}: {
  profile: { nickname: string; photo_url: string | null } | null;
  pendingCount?: number;
  balance?: number | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-ice/5 bg-night/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Jahuga — inicio">
          <Image src="/assets/logo.svg" alt="Jahuga" width={118} height={30} priority />
        </Link>

        {profile ? (
          <div className="flex items-center gap-2.5">
            <Link
              href="/wallet"
              aria-label="Tu wallet de Coins"
              className="flex h-10 items-center gap-1.5 rounded-full border border-ice/10 bg-navy/80 pl-1.5 pr-3 active:bg-navy-raised/80"
            >
              <Image src="/assets/jahuga-coin-transparent.png" alt="" width={26} height={26} />
              <span className="font-ui text-sm font-extrabold text-ice">
                {balance === null ? "—" : formatCoins(balance)}
              </span>
            </Link>

            <Link
              href="/"
              aria-label={`Notificaciones${pendingCount ? `: ${pendingCount} retos pendientes` : ""}`}
              className="relative flex size-10 items-center justify-center rounded-full border border-ice/10 bg-navy/80"
            >
              <BellIcon />
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
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-10 items-center rounded-full border border-ice/15 bg-navy/80 px-4 font-ui text-sm font-bold text-ice active:bg-navy-raised"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a6 6 0 0 0-6 6v3.2l-1.6 3A1 1 0 0 0 5.3 16.5h13.4a1 1 0 0 0 .9-1.4L18 12.2V9a6 6 0 0 0-6-6Z"
        fill="#EAF0FF"
        fillOpacity="0.9"
      />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke="#EAF0FF" strokeOpacity="0.9" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
