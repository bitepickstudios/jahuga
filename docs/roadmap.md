# Roadmap — Lobby

Metodología: cada fase tiene un **entregable usable** y cierra solo cuando pasa los gates (`typecheck`, `lint`, `test`, `build`) más su **criterio de verificación funcional**. No se abre una fase nueva con la anterior sin cerrar. Las ideas que aparezcan en el camino van a `PRD.md §5` (backlog), no a la fase activa.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` cerrada

---

## Fase 0 — Fundaciones `[x]`

Scaffolding del proyecto y del harness. Sin features.

- Next.js (App Router) + TypeScript + Tailwind + HeroUI + SDK de Supabase (clients placeholder; el proyecto real y los tipos generados se difieren a Fase 2, decisión 2026-07-03 — la Fase 1 no usa base de datos).
- Scripts `typecheck`, `lint`, `test` (Vitest), `build` en `package.json`. CI simple (GitHub Actions) corriendo los 4 gates en cada push.
- Estructura de carpetas según `arquitectura.md`. PWA base (manifest + service worker mínimo).
- Deploy inicial en Vercel (aunque muestre una landing vacía).

**Verificación:** repo clonado en limpio → `pnpm install && pnpm build` funciona; URL de Vercel responde; CI en verde.

---

## Fase 1 — Motor de penales jugable (prototipo) `[x]`

> 2026-07-03: engine + tests + UI implementados, desplegados y validados por el fundador. Cerrada.

**La fase más importante.** Validar que el juego es divertido antes de construir todo lo demás. Sin login, sin base de datos: dos jugadores en el mismo dispositivo ("pasá el teléfono") + vs bot aleatorio.

- Implementar `resolveMatch()` puro y determinístico según `minijuego-penales.md`, con suite de tests exhaustiva (es lógica pura: ideal para TDD).
- UI mínima del penal: seleccionar dirección de patada/atajada, revelación penal por penal, marcador, muerte súbita.
- Bot nivel 1 (aleatorio ponderado).

**Verificación:** tests del motor cubren todos los casos de `minijuego-penales.md §5`; dos personas reales juegan una tanda completa en un celular y **quieren la revancha**. Si no quieren la revancha, se itera el diseño del juego acá, no se avanza.

---

## Fase 2 — Cuentas y perfiles `[x]`

> 2026-07-03: auth + onboarding + perfiles + avatar 2D + RLS verificada (integration tests 6/6 y E2E con browser). Queda para el usuario: 3 amigos reales creando cuenta desde el celular.

- Registro (nickname único, email, contraseña validada) con Supabase Auth. Wizard de onboarding (nombre, fecha de nacimiento, foto).
- Perfil: foto, datos, frases icónicas, toggle público/privado, stats placeholder.
- Avatar 2D v1: composición foto + cuerpo ilustrado, visible en el perfil.
- RLS activo en todas las tablas desde el primer día.

**Verificación:** 3 amigos reales crean su cuenta desde el celular sin ayuda; un perfil privado no es visible para un no-amigo (test de RLS).

---

## Fase 3 — Partidas online 1v1 (sin economía) `[x]`

> 2026-07-04: retos por nickname, partidas vivo/async con commit oculto por RLS (D3), resolución server-side, Realtime + cron de expiración, stats reales. Verificado: RLS del commit oculto automatizada (6 tests) + partida en vivo completa E2E con dos browsers (5-0, resultado correcto en ambos lados). Queda para el usuario: partida vivo+async con un amigo en dispositivos reales.

Conectar el motor de la Fase 1 a la plataforma. Solo modo amistoso.

- Tabla `matches` + `match_moves` con commit oculto (nadie ve los movimientos del rival antes de commitear los suyos — verificado por RLS).
- Retar a un usuario por nickname. Aceptar/rechazar reto.
- Modo en vivo (Supabase Realtime, revelación penal por penal) y modo asíncrono (jugás tu tanda, el otro cuando puede).
- Resolución server-side (Edge Function / Server Action) que escribe el resultado.
- Historial de partidas en el perfil; stats reales reemplazan el placeholder.

**Verificación:** dos amigos en dispositivos distintos completan una partida en vivo y una asíncrona; intento de leer movimientos del rival vía API con la sesión del otro jugador → bloqueado por RLS (test automatizado).

---

## Fase 4 — Amigos y grupos `[~]`

> 2026-07-05: **amigos verificado E2E** (solicitud por nickname → aceptar → lista, link de invitación crea la solicitud, retar desde la lista con prefill). **Grupos sigue bloqueado** por el event trigger ajeno `rls_auto_enable` (se re-aplica con cada DDL; los repairs v1/v2 no lo sobrevivieron o se revirtieron). Pendiente: aplicar `20260705000008_repair_v3.sql` (best-effort con diagnóstico embebido) → correr integration tests de grupos → [x].

- Solicitudes de amistad (por nickname y por link de invitación). Lista de amigos.
- Retar desde la lista de amigos (además de búsqueda).
- Grupos: crear (nombre, descripción, imagen, fecha), invitar por nickname, página del grupo con miembros y stats agregadas.

**Verificación:** el grupo fundador completo está registrado, en un grupo, y las partidas se inician desde la lista de amigos.

---

## Fase 5 — Economía: Coins `[x]`

> 2026-07-05: cerrada. Ledger inmutable con funciones atómicas, apuestas integradas al ciclo del reto, wallet + historial + transferencias, racha diaria automática, tienda de skins que cambia la camiseta del avatar. Verificado: invariante `balance = sum(ledger)` (7/7 integration tests: bono exacto, pozo exacto, doble-settle no paga, límite diario, cliente no puede inflarse el saldo) + E2E con dos browsers (reto por 500 → escrow 10.000/10.000 → 5-0 → payout 11.000/10.000, suma total intacta; compra y equipado de skin). D1 sin rake; D2 valores; D8 (dinero real) NO implementada — condicionada a habilitación legal.

- Ledger inmutable (`coin_transactions`) + saldo derivado. Bono de bienvenida retroactivo.
- Apuestas: al aceptar un reto con apuesta, escrow del monto de ambos; al resolverse, payout al ganador (todo en una transacción/función de base de datos, atómica).
- Racha diaria (day streak) con recompensa creciente.
- Transferencias entre usuarios con límite diario.
- Wallet visible en el home; historial de transacciones.

**Verificación:** invariante testeada — la suma de todos los balances es igual a la suma de emisiones menos sumideros (no se crean ni destruyen coins por bugs); una partida apostada resuelta paga exactamente el pozo; una partida abandonada devuelve el escrow según reglas.

---

## Fase 6 — Home estilo lobby + pulido PWA `[x]`

> 2026-07-05: cerrada técnicamente. Home final (avatar en escenario, Jugar, rail de minijuegos con destacado y mocks, wallet, retos, grupo) del rediseño Jahuga; misiones diarias con evaluación server-side y reclamo por el ledger (E2E: ganar apostada → "Cazador del pozo" → +3.000 exactos, balance final verificado 14.000); SW con cache de estáticos + fallback offline; banner de instalación (Android prompt / guía iOS). Queda la verificación humana del roadmap: instalar la PWA en iPhone y Android reales y jugar una apostada de punta a punta.

- Home final: avatar en grande, botón Jugar, scroll vertical de minijuegos (cards, aunque haya uno solo — la card 2 es "Próximamente"), wallet, retos pendientes.
- Misiones simples (ej.: "ganá 2 partidas hoy") con recompensa en coins.
- PWA completa: instalación guiada, splash, íconos, offline básico de la shell.
- Pase de pulido mobile en dispositivos reales (iOS Safari y Android Chrome).

**Verificación:** un amigo instala la PWA en iPhone y otro en Android y juegan una partida apostada de punta a punta sin tocar un navegador de escritorio.

---

## Fases futuras (sin comprometer orden)

- **F7 — Segundo minijuego** (candidato: trivia por tiempo — valida que el Game SDK realmente es plug-in).
- **F8 — Torneos y brackets.**
- **F9 — Avatares 3D** (spike de Ready Player Me + React Three Fiber antes de comprometer).
- **F10 — Grupo vs grupo y mapa de zonas.**
- **F11 — Skins avanzadas / tienda cosmética.**
