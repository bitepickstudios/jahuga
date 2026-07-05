# DESIGN.md — Jahuga

**Fuente de verdad visual.** Derivado de `public/assets/referencia_desktop.png` y `referencia_mobile.png`. Si un componente contradice este doc, gana el doc; si el doc queda corto, se actualiza acá primero.

## 1. Identidad

- **Nombre:** Jahuga · **Dominio:** jahuga.app · Antes "Lobby" (renombrado 2026-07).
- **Logo:** `public/assets/logo.svg` — wordmark itálico blanco (86% opacidad). Se usa sobre fondos oscuros, nunca sobre claro. Altura mínima 24px.
- **Concepto visual: "noche de estadio".** Todo pasa dentro de un estadio de noche: azul profundo, luces eléctricas, banderas, un escenario central donde vive tu avatar. La UI son tarjetas translúcidas flotando sobre esa escena — como HUD de videojuego, no como página web.
- **Tono de copy:** voseo paraguayo, directo, competitivo y con humor de grupo de amigos ("Nada de mirar. La gracia es no saber."). Verbos de acción: Jugar, Retar, Aceptar.

## 2. Color

Tokens Tailwind (definidos en `src/app/globals.css` vía `@theme`):

| Token | Hex | Uso |
|---|---|---|
| `night` | `#070D1F` | Fondo base de página (debajo de las imágenes de fondo) |
| `navy` | `#0D1830` | Superficie de tarjeta (con transparencia: `bg-navy/80`) |
| `navy-raised` | `#15234A` | Superficie elevada, hover de tarjeta |
| `volt` | `#C8F531` | **Acción primaria** (Jugar, Aceptar, CTA), estado activo del nav, foco destacado |
| `volt-ink` | `#101800` | Texto sobre volt |
| `danger` | `#E03131` | Retos entrantes (header de card), Rechazar, derrotas, errores |
| `gold` | `#F5B93B` | Coins, recompensas, ATAJADO en la revelación |
| `ice` | `#EAF0FF` | Texto principal (usar `/60`, `/40` para jerarquías) |
| `pitch` | `#2E7D4F` | Solo elementos de cancha (césped, GOL glow) |

Reglas:
- **Volt es escaso.** Un solo elemento volt dominante por pantalla (el CTA principal). Todo lo demás compite en silencio.
- Bordes de tarjeta: `border-ice/10`; tarjeta destacada: `border-volt` + glow `shadow-[0_0_24px_rgba(200,245,49,0.25)]`.
- Rojo solo para retos/peligro/derrota — nunca decorativo.
- Online dot: verde `#3ADC5A`, 8–10px, esquina del avatar.

## 3. Tipografía

| Rol | Fuente | Uso |
|---|---|---|
| UI / headings | **Manrope** (700/800, `--font-ui`) | Títulos de sección, botones, números de stats, nav |
| Cuerpo | **Geist** (`--font-sans`) | Texto corrido, labels, hints |
| Momento de juego | **Anton** (`--font-display`) | SOLO veredictos in-game (¡GOL!, marcador gigante, GANASTE). Nunca en navegación ni formularios |

Escala: título de pantalla 28–32px/800 · sección 13px uppercase tracking-widest `ice/50` · botón 16–18px/700 · stat grande 28–32px/800.

## 4. Superficies y forma

- Radios: tarjeta `rounded-2xl` (16px) · botón `rounded-xl` (12px) · chip/pill `rounded-full`.
- Tarjeta tipo: `bg-navy/80 backdrop-blur border border-ice/10 rounded-2xl p-4`.
- Los fondos de página llevan **overlay de legibilidad**: gradiente `from-night/60 via-night/30 to-night/90` encima de la imagen. Texto nunca directamente sobre foto sin overlay.
- Sombra de CTA volt: `shadow-[0_4px_0_rgba(0,0,0,0.35)]` (botón "físico" de juego) + `active:translate-y-0.5 active:shadow-none`.

## 5. Layout

**Mobile-first (390px):** columna única con scroll; header fijo arriba; **bottom nav fijo** (5 ítems); contenido con `pb-24` para no chocar el nav; safe-area (`env(safe-area-inset-bottom)`).

**Desktop (≥1024px):** misma app, no otra. Grid de 3 columnas sobre el fondo de estadio: izquierda (Mi Grupo, amigos en línea), centro (avatar en escenario), derecha (reto pendiente, Jugar/Retar/Vs Máquina). Rail de minijuegos abajo. **El bottom nav se mantiene también en desktop** (referencia lo muestra): barra centrada, misma semántica.

Jerarquía del home (ambos breakpoints): 1) Jugar · 2) reto pendiente si existe · 3) avatar/identidad · 4) minijuegos · 5) social.

## 6. Navegación

**Header** (todas las pantallas con shell):
- Izquierda: logo Jahuga (link a `/`).
- Derecha: pill de Coins (ícono `jahuga-coin` + balance + botón `+` cuando exista tienda) → wallet (F5); campana con badge rojo (retos/notificaciones pendientes); avatar circular con online dot → `/perfil`.

**Bottom nav** — 5 ítems fijos: `Lobby` (/) · `Amigos` (/amigos) · `Grupo` (/grupo) · `Skins` (/skins) · `Perfil` (/perfil).
- Activo: ícono+label volt y barrita superior de 2px volt.
- Inactivo: `ice/50`. Badge de novedad: punto rojo en esquina del ícono.
- Pantallas inmersivas (`/play/*`, auth, onboarding) **no** llevan shell: el juego ocupa todo.

## 7. Componentes

- **Botón primario (volt):** fondo volt, texto `volt-ink` 700, alto ≥48px, ícono opcional a la izquierda. Solo acciones que avanzan el juego.
- **Botón secundario:** `bg-navy/80 border border-ice/15 text-ice`, chevron `›` a la derecha cuando navega (Retar, Vs Máquina).
- **Botón peligro:** borde `danger`, texto danger, fondo transparente (Rechazar).
- **Card de reto pendiente:** header rojo con título "Reto pendiente" + chip de tiempo; cuerpo con avatar del retador, "X te retó" (+ monto en coins cuando haya apuestas); acciones Aceptar (volt) / Rechazar (peligro).
- **Card Mi Grupo:** título + fila de avatares solapados + stats (⭐ pts, 🏆 victorias) + chevron a la página del grupo.
- **Card de minijuego:** imagen del juego de fondo (16:10), nombre abajo. Estados: **destacado** (borde volt + chip `DESTACADO` + fila "jugando ahora"), **normal**, **bloqueado** (chip `PRÓXIMAMENTE`, candado, imagen mock desaturada). Rail horizontal con snap en mobile, fila en desktop.
- **Coin pill:** `bg-navy/80 border-ice/10 rounded-full`, ícono moneda + cantidad 800.
- **Marcador de tanda:** dots ⚽/❌/· sobre card navy; score en Anton.
- **Chips:** `DESTACADO` volt/ink · `PRÓXIMAMENTE` `bg-ice/10 text-ice/70` · timer `bg-night/60`.

## 8. Assets

| Asset | Ruta | Uso |
|---|---|---|
| Logo | `public/assets/logo.svg` | Header, splash |
| Moneda | `public/assets/jahuga-coin-transparent.png` | Coin pill, montos, ícono PWA |
| Fondo lobby mobile | `public/assets/jahuga_bg_mobile_penaltys.png` | Home ≤768px (cover, fixed) |
| Fondo lobby desktop | `public/assets/jahuga_bg_desktop_penaltys.png` | Home >768px |
| Fondo juego penales | `public/assets/jahuga__game_bg_penaltys.png` | Pantallas `/play/*` con overlay |
| Mocks de juegos futuros | — | Card bloqueada con gradiente + emoji hasta tener arte real |

Imágenes de fondo siempre `background-size: cover` + overlay §4. Nada de estirar el logo.

## 9. Motion

- Revelación del penal: la secuencia ya definida (pelota → arquero → veredicto spring). Es EL momento — nada compite con él.
- Transiciones de pantalla: fade/slide sutil ≤200ms. Micro: `active:scale-95` en botones.
- `prefers-reduced-motion`: respetado siempre (MotionConfig `reducedMotion="user"`).

## 10. Accesibilidad

- Touch targets ≥44px. Contraste: ice sobre navy ≥4.5:1; volt-ink sobre volt ≥7:1.
- Focus visible: anillo volt en todos los interactivos.
- Toggles con `role="switch"` + `aria-checked`; el arco con `aria-label` por zona.
- Probar Safari iOS real por fase (regla del stack).
