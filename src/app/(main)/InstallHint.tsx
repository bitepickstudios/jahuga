"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "jahuga:install-hint";

/** Banner de instalación PWA: prompt nativo en Android/Chrome, guía en iOS Safari. */
export function InstallHint() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone);
    if (isStandalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Diferido: la regla react-hooks/set-state-in-effect prohíbe setState síncrono acá
    const iosTimer = setTimeout(() => {
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setShowIosHint(true);
    }, 0);

    return () => {
      clearTimeout(iosTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setInstallEvent(null);
    setShowIosHint(false);
  }

  if (!installEvent && !showIosHint) return null;

  return (
    <div className="mx-auto mt-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-ice/10 bg-navy/90 p-3.5 px-4">
      <span className="text-2xl" aria-hidden>
        📲
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-ui text-sm font-extrabold text-ice">Instalá Jahuga</p>
        <p className="text-xs text-ice/50">
          {installEvent
            ? "Directo en tu pantalla de inicio, como una app."
            : "En Safari: Compartir → «Agregar a pantalla de inicio»."}
        </p>
      </div>
      {installEvent && (
        <button
          type="button"
          onClick={() => {
            installEvent.prompt();
            dismiss();
          }}
          className="shrink-0 rounded-xl bg-volt px-3.5 py-2 font-ui text-sm font-extrabold text-volt-ink active:scale-95"
        >
          Instalar
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar aviso de instalación"
        className="shrink-0 p-1 text-ice/40 active:text-ice"
      >
        ✕
      </button>
    </div>
  );
}
