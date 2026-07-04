# Spec — Minijuego: Tanda de Penales

**Estado:** v1 para prototipo (Fase 1 del roadmap). El diseño de balance (§4) se valida jugando; se espera iterarlo.

## 1. Concepto

Tanda de penales 1v1. Cada jugador patea 5 penales y ataja 5. El movimiento es elegir **dirección**. Gana quien convierte más; empate → muerte súbita. Es un juego de lectura del rival (mind game), no de reflejos: funciona igual de bien en vivo que asíncrono.

## 2. Movimientos

v1 mantiene el espacio de decisión chico para que el mind game sea legible:

- **Pateador elige:** dirección ∈ { izquierda, centro, derecha } + potencia ∈ { colocado, fuerte }.
- **Arquero elige:** dirección ∈ { izquierda, centro, derecha } + timing ∈ { esperar, adelantarse }.

## 3. Resolución de un penal

Determinística con un único punto de azar controlado por `seed` (para que la repetición sea reproducible):

1. **¿Adivinó el arquero?** Si dirección_arquero ≠ dirección_patada → **GOL** (salvo §3.4).
2. **Si adivinó:**
   - patada *colocada* + arquero *esperar* → **ATAJADA**.
   - patada *colocada* + arquero *adelantarse* → **ATAJADA** (llegó antes).
   - patada *fuerte* + arquero *esperar* → **GOL** (no llega a reaccionar).
   - patada *fuerte* + arquero *adelantarse* → **ATAJADA**.
3. **Riesgo de la potencia fuerte:** toda patada *fuerte* tiene probabilidad `p_fallo = 0.15` de irse afuera (**ERRADO**, ni gol ni atajada — cuenta como no convertido). Derivado del seed + round: reproducible, no re-rolleable.
4. **Excepción del centro:** patada al *centro* + arquero *adelantarse* hacia cualquier lado → **GOL** (el clásico Panenka-castigo). Patada al *centro* + arquero *esperar* en el centro → **ATAJADA**.

Matriz resumen (patada / arquero adivinó dirección):

| | Arquero espera | Arquero se adelanta |
|---|---|---|
| **Colocado** | Atajada | Atajada |
| **Fuerte** | Gol | Atajada (pero 15% errado) |
| **Centro** | Atajada | Gol |

Con arquero a la dirección equivocada: siempre gol, salvo el 15% de errado si fue fuerte.

Por qué funciona: no existe estrategia dominante. Fuerte castiga al arquero pasivo pero arriesga el errado; colocado es seguro salvo que te lean; centro castiga al arquero ansioso. Es piedra-papel-tijera con textura.

## 4. Parámetros de balance (iterables)

```ts
export const PENALES_CONFIG = {
  rounds: 5,
  pMissStrong: 0.15,
  suddenDeathMaxRounds: 10,   // después: gana quien más atajadas hizo; si persiste, empate
};
```
Viven en el engine, un solo lugar. Cambiarlos no toca UI ni datos.

## 5. Casos que el test suite debe cubrir

- Las 9 combinaciones de la matriz × 2 timings, con y sin fallo de potencia.
- Tanda que se define antes del 5.º penal (matemáticamente decidida) → ¿se corta o se juega entera? **v1: se juega entera** (más momentos, más drama).
- Empate 5-5 → muerte súbita alternada; resolución al primer desnivel por ronda.
- Determinismo: mismo seed + mismos movimientos = mismo resultado, siempre.
- Movimiento inválido (dirección inexistente, ronda repetida) → rechazado por `validateMove`.

## 6. Modos

- **En vivo:** ambos conectados. Por cada penal: ambos commitean su movimiento de la ronda (pateador y arquero según turno) → server revela → animación → siguiente. Tensión máxima; modo por defecto.
- **Asíncrono:** cada jugador commitea sus 10 decisiones (5 pateando + 5 atajando) cuando puede. Al estar ambas tandas completas, el server resuelve todo y ambos ven la repetición completa. Expiración del reto: 48 h.

Mismo engine, mismo esquema de datos; cambia solo cuándo se revela.

## 7. Abandono y expiración (afecta apuestas)

- Reto no aceptado en 48 h → `expired`, refund total del escrow (si el retador ya escrowó).
- Partida activa abandonada (sin movimientos del jugador X en 48 h, modo async) → gana el rival por walkover, payout normal.
- En vivo: si un jugador se desconecta, la partida pasa a async automáticamente (sus decisiones pendientes las puede completar después). No se pierde por caída de internet.

## 8. Bot ("vs máquina")

- **Nivel 1 — Aleatorio:** direcciones uniformes, potencia/timing aleatorios.
- **Nivel 2 — Ponderado:** distribución realista (esquinas > centro) y algo de lectura de rachas.
- **Nivel 3 — Perfilador:** usa el historial del jugador en `matches` para explotar sus sesgos, y al final se los muestra ("pateaste a la derecha el 60% de las veces"). Este feedback es contenido: enseña a jugar mejor contra humanos.

El bot elige con el mismo tipo `Move`; para el engine es un jugador más.

## 9. UI del penal (mobile-first)

- Selección con pulgar: tres zonas grandes de dirección + toggle de potencia/timing. Target ≥ 44px.
- Revelación: animación del avatar (pose `kick` / `save` de `<PlayerAvatar/>`), pelota, red o atajada, marcador tipo tanda real (⚽⚽❌⚽·).
- Repetición compartible al final (v1: pantalla de resultado; futuro: clip/gif).
