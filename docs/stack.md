# Stack y decisiones tecnológicas — Lobby

Regla general: el stack conocido (Next.js + Supabase) resuelve todo lo de v1. Tecnología nueva solo entra cuando una fase la exige, con un spike previo acotado.

## Core

| Capa | Elección | Motivo |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Stack dominado; Server Components y Server Actions cubren la mayoría de las mutaciones |
| UI | **Tailwind + HeroUI** | Velocidad; consistente con proyectos existentes |
| Animación UI | **Framer Motion** | Revelación de penales, celebraciones, transiciones del lobby |
| Backend / DB | **Supabase** (Postgres + Auth + Realtime + Edge Functions + Storage) | Auth resuelto, RLS para el commit oculto de movimientos, Realtime para el modo en vivo, Storage para fotos/imágenes de grupo |
| Deploy | **Vercel** | Cero fricción con Next.js |
| Tests | **Vitest** (+ Testing Library donde aporte) | El motor de penales es lógica pura → tests baratos y valiosos |
| Package manager | **pnpm** | — |

## Decisiones específicas

### PWA, no app nativa (v1)
Instalable desde el navegador (manifest + service worker), pantalla completa, ícono en home screen. Evita stores, reviews, cuentas de developer y el 30% de comisión si algún día hay cosméticos pagos. **Camino de escape:** Capacitor envuelve esta misma app para publicar en stores sin reescribir. Push notifications quedan para después (soporte iOS con limitaciones).

### Tiempo real: Supabase Realtime alcanza
Los penales son decisión simultánea / por turnos — se sincronizan **eventos**, no frames. Realtime (Postgres Changes o Broadcast) sobra. **No** introducir Colyseus/WebSockets propios hasta que exista un juego que sincronice estado continuo (la carrera 3D, algún día).

### Resolución de partidas: server-side siempre
`resolveMatch()` corre en una Supabase Edge Function (o Server Action). El cliente solo commitea movimientos y renderiza resultados. Motivos: anti-trampa, determinismo, un solo lugar donde vive la regla del juego.

### Commit oculto de movimientos
Los movimientos se guardan en `match_moves` con RLS que impide leer filas del rival hasta que la partida esté en estado `resolved` (o, en modo en vivo, hasta que el penal correspondiente esté revelado). Sin criptografía rara: RLS bien escrita es suficiente para este threat model (amigos, no atacantes).

### Motor de juego por minijuego, no motor único
- Penales: React + Framer Motion (no hace falta canvas ni engine).
- Futuro 2D con física/sprites: Phaser, embebido como módulo.
- Futuro 3D: React Three Fiber (+ drei). Avatares GLB de Ready Player Me.
Cada juego elige su tecnología de render; todos hablan con la plataforma por el mismo contrato (ver `arquitectura.md`).

### Avatar 2D v1
Composición de capas (foto recortada + cuerpo ilustrado + skin) renderizada con SVG/CSS. Assets propios: cuerpo base en 3 poses (lobby, pateando, atajando), 4–6 skins iniciales. Sin editor: se equipa, no se diseña.

### Mobile-first concreto
- Viewport de diseño: 390×844. Breakpoints de Tailwind hacia arriba.
- Touch targets ≥ 44px; la selección de dirección del penal se hace con el pulgar.
- Probar en Safari iOS real cada fase (es donde las PWA duelen).

## Qué NO usar en v1 (y por qué)

- **Colyseus / servidor de juego dedicado:** no hay juego de tiempo real continuo todavía.
- **Three.js / R3F:** no hay 3D en v1; entra con el spike de avatares (F9).
- **Librería de estado global (Zustand/Redux):** Server Components + Realtime + React state cubren v1. Reevaluar si aparece dolor real.
- **Monorepo/turborepo:** un solo app. Los minijuegos son carpetas, no paquetes, hasta que exista el tercero.
- **Pagos (Bancard, etc.):** no hay dinero real en el producto. Punto.
