import Link from "next/link";

export function ComingSoon({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-6xl" aria-hidden>
        {emoji}
      </p>
      <h1 className="font-ui text-3xl font-extrabold text-ice">{title}</h1>
      <p className="text-ice/60">{description}</p>
      <span className="rounded-full bg-ice/10 px-4 py-1.5 font-ui text-xs font-bold uppercase tracking-wide text-ice/70">
        Próximamente
      </span>
      <Link href="/jugar" className="mt-2 font-ui font-bold text-volt underline-offset-4">
        Mientras tanto: jugá penales ›
      </Link>
    </main>
  );
}
