# Decisiones abiertas — Lobby

Decisiones que el agente **no debe asumir**. Cuando una fase las necesite, se resuelven acá primero (con fecha y razón) y recién después se implementan.

## D1 — Rake en apuestas (sumidero de coins) ✅ RESUELTA
**Decisión 2026-07-04: lanzar sin rake.** El pozo paga 100% al ganador. Monitorear masa monetaria (las skins son el sumidero); agregar rake solo si la economía infla.

## D2 — Valores iniciales de la economía ✅ RESUELTA
**Decisión 2026-07-04 (adopta la propuesta del doc):** bienvenida **10.000** · racha diaria **500 × día de racha, tope 5.000** · misión diaria 1.000–3.000 (F6) · skins **25.000–100.000** · transferencia máx. **20.000/día**. Todos los valores viven en `src/features/economy/config.ts` — un solo lugar, iterables.

## D8 — Compra y retiro de Coins por dinero real (pedido del fundador, 2026-07-04)
El fundador quiere Coins comprables y retirables por dinero real, bajo la tesis "habilidad, no azar". **Estado: NO implementado y condicionado a habilitación legal.** Razones registradas: (1) la decisión original documentó el riesgo Conajzar/procesadores; (2) el motor de penales tiene azar por diseño (15% de errado) — debilita la tesis de skill puro ante un regulador; (3) faltan licencia/dictamen, KYC/AML, verificación de edad (D5 abierta) y procesador que acepte el rubro. **Prerequisitos para reabrir:** dictamen legal escrito + licencia o resolución del regulador + KYC + verificación de edad + partner de pagos. El ledger ya queda extensible por `kind` para enchufar una capa de compra si eso llega.

## D3 — Revelación en modo en vivo ✅ RESUELTA
**Decisión 2026-07-03: la revelación ES la RLS.** Los movimientos del rival en la ronda N se vuelven visibles cuando ambos jugadores commitearon la ronda N (función `security definer` en la policy de `match_moves`), o todos al estar la partida `resolved`. El server resuelve el resultado tras cada commit (Server Action con service role, motor determinístico). Mismo mecanismo sirve para vivo y async sin estado extra de "ronda revelada"; Realtime notifica cuando la fila del rival se vuelve visible. La autoridad siempre es el servidor.

## D4 — Nickname: ¿editable? ✅ RESUELTA
**Decisión 2026-07-03: NO editable en v1.** El nickname queda fijo al registrarse. Cero riesgo de romper la búsqueda social; editabilidad (con cooldown) se agrega después si duele. Ver registro abajo.

## D5 — Menores en la plataforma
Si algún amigo del grupo (o futuro usuario) es menor de edad, ¿hay restricciones? Aunque las coins no sean dinero, la mecánica de apuesta es sensible. Mínimo: edad requerida en registro y términos claros de "moneda sin valor real". Definir antes de abrir más allá del grupo fundador.

## D6 — Pipeline de avatar 3D (futuro, F9)
Ready Player Me vs alternativa vs assets propios estilizados. Requiere spike: costo, licencia, calidad del GLB en mobile, si permite skins custom encima. No decidir hasta F9.

## D7 — Segundo minijuego (futuro, F7)
Candidatos: trivia por tiempo (valida Realtime competitivo), boxeo por combinaciones (diseño ya conversado), cartas RPG. Criterio: el que más valide el Game SDK con el menor costo. Decidir al cerrar F6.

---

## Registro de decisiones tomadas

| Fecha | Decisión | Razón |
|---|---|---|
| 2026-07 | **Sin dinero real en la economía.** Coins no comprables, no retirables, no canjeables. | Cash-out + apuestas P2P = territorio de gambling regulado (Conajzar) y riesgo con procesadores de pago. La emoción se conserva; el riesgo legal no. |
| 2026-07 | Web PWA, no apps nativas en v1. | Sin fricción de stores; Capacitor como escape futuro. |
| 2026-07 | Avatar 2D por capas en v1; esquema preparado para GLB. | El 3D es un pozo de tiempo que no valida nada del core. |
| 2026-07 | Primer minijuego: penales (reemplaza al boxeo como primero). | Comprensión universal, misma simplicidad técnica de decisión simultánea. |
| 2026-07 | Supabase Realtime, sin servidor de juego dedicado. | Juegos por eventos/turnos; Colyseus recién si hay tiempo real continuo. |
| 2026-07-03 | Proyecto Supabase diferido a Fase 2 (en Fase 0 solo SDK + clients placeholder). | La Fase 1 no usa base de datos; crear el proyecto hoy es fricción sin validación. |
| 2026-07-03 | D4: nickname no editable en v1. | Simplicidad y búsqueda social estable; editabilidad con cooldown solo si duele. |
| 2026-07-04 | Rename: la plataforma se llama **Jahuga** (jahuga.app); la moneda queda como "Coins". | Decisión del fundador; el repo ya se llamaba jahuga. Identidad visual definida en docs/DESIGN.md. |
| 2026-07-04 | D3 implementada como RLS-como-revelación (ver D3 arriba). | Un solo mecanismo para vivo y async. |
