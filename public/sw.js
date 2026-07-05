// Service worker Jahuga — offline básico de la shell (roadmap F6).
// Estáticos con cache-first; navegación con network-first y fallback offline.
const STATIC_CACHE = "jahuga-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const OFFLINE_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión — Jahuga</title>
<style>body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#070d1f;color:#eaf0ff;font-family:system-ui,sans-serif;text-align:center;padding:24px}h1{font-size:22px;margin:0}p{color:rgba(234,240,255,.6);margin:0}</style>
</head><body><div style="font-size:48px">📡</div><h1>Sin conexión</h1>
<p>Jahuga necesita internet para jugar online.<br>Reintentá cuando vuelvas a tener señal.</p></body></html>`;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/") ||
    /\.(png|svg|jpg|jpeg|webp|woff2?)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
      ),
    );
  }
});
