"use client";

import { useState } from "react";

export function CopyInviteLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-ice/15 bg-night/50 px-4 text-left active:bg-ice/5"
    >
      <span className="truncate text-sm text-ice/70">…/invite/{code.slice(0, 13)}…</span>
      <span className="shrink-0 font-ui text-sm font-extrabold text-volt">
        {copied ? "¡Copiado!" : "Copiar link"}
      </span>
    </button>
  );
}
