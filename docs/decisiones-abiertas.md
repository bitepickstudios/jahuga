# Decisiones abiertas — Lobby

Decisiones que el agente **no debe asumir**. Cuando una fase las necesite, se resuelven acá primero (con fecha y razón) y recién después se implementan.

## D1 — Rake en apuestas (sumidero de coins)
¿El pozo de una apuesta paga 100% al ganador, o la plataforma retiene un % (ej. 5%) como sumidero anti-inflación?
- **A favor del rake:** sin sumideros fuertes, la masa de coins solo crece y los montos pierden significado.
- **En contra:** entre amigos puede sentirse "impuesto". Las skins ya son sumidero.
- **Recomendación pendiente de validar:** lanzar sin rake, monitorear masa monetaria (F5), agregar si infla.

## D2 — Valores iniciales de la economía
Bono de bienvenida, recompensas de streak/misiones, precios de skins, límite diario de transferencia. Propuesta inicial a validar: bienvenida 10.000 · victoria de misión diaria 1.000–3.000 · skins 25.000–100.000 · transferencia máx. 20.000/día. Definir antes de F5.

## D3 — Revelación en modo en vivo
¿El server resuelve ronda por ronda (revela al cerrar cada penal) o resuelve todo al final y el cliente "dosifica" la revelación? Ronda por ronda es más honesto para el modo en vivo pero complica el estado; resolución diferida simplifica pero exige que en vivo ambos commiteen todo antes de ver nada. **Impacta F3; decidir al diseñar la Edge Function.**

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
