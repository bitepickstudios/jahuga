// Service worker mínimo de Fase 0: habilita instalabilidad PWA.
// ponytail: sin caché offline todavía — entra en Fase 6 (pulido PWA).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
