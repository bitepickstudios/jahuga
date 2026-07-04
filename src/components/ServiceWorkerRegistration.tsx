"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sin SW no se rompe nada: la app funciona igual, solo no es instalable.
      });
    }
  }, []);

  return null;
}
