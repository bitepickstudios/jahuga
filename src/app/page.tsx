import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="font-display text-7xl uppercase text-chalk">
        Lobby<span className="text-albirroja">.</span>
      </h1>
      <p className="max-w-xs text-lg text-chalk/60">
        Minijuegos entre amigos. Retá, apostá Lobby Coins y ganá reputación.
      </p>
      <Link
        href="/play/local"
        className="flex min-h-12 w-full max-w-xs items-center justify-center rounded-md bg-albirroja px-6 font-display text-xl uppercase tracking-wide text-chalk transition-transform active:scale-95"
      >
        Jugar penales
      </Link>
    </main>
  );
}
