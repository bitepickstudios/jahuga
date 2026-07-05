"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondFriendRequest } from "@/features/friends/actions";

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function respond(accept: boolean) {
    setBusy(true);
    await respondFriendRequest(requestId, accept);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => respond(true)}
        aria-label="Aceptar solicitud"
        className="flex size-10 items-center justify-center rounded-xl bg-volt font-bold text-volt-ink transition-transform active:scale-95 disabled:opacity-60"
      >
        ✓
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => respond(false)}
        aria-label="Rechazar solicitud"
        className="flex size-10 items-center justify-center rounded-xl border border-danger text-danger active:bg-danger/10 disabled:opacity-60"
      >
        ✕
      </button>
    </div>
  );
}
