# CLAUDE.md — Lobby

Contrato de trabajo para el agente. Leer antes de tocar código. Los documentos en `/docs` son la fuente de verdad del producto; este archivo define cómo se trabaja.

## Qué es Lobby

Plataforma social web de minijuegos entre amigos. Los usuarios crean su perfil con avatar, pertenecen a grupos, se retan 1v1 en minijuegos apostando Lobby Coins (moneda virtual **no comprable, no canjeable por dinero real**) y acumulan puntos, skins y reputación. Primer minijuego: tandas de penales por decisión simultánea.

## Fuente de verdad

| Documento | Contenido |
|---|---|
| `docs/PRD.md` | Visión, usuarios, features, scope v1 vs futuro |
| `docs/roadmap.md` | Fases de desarrollo con entregables y gates |
| `docs/stack.md` | Stack y decisiones tecnológicas |
| `docs/arquitectura.md` | Screaming architecture, contrato Game SDK |
| `docs/modelo-datos.md` | Esquema de base de datos y RLS |
| `docs/minijuego-penales.md` | Spec completa del primer minijuego |
| `docs/decisiones-abiertas.md` | Decisiones pendientes — NO asumir, preguntar |

Si el código contradice a `/docs`, el doc manda. Si un doc quedó obsoleto, actualizarlo en el mismo PR que el código.

## Reglas de trabajo

1. **Una fase a la vez.** Trabajar solo en la fase activa de `docs/roadmap.md`. No adelantar features de fases futuras aunque "ya que estamos".
2. **Spec antes de código.** Si una tarea no está especificada en `/docs`, primero escribir/actualizar la spec, después implementar.
3. **Gates obligatorios antes de dar por terminado cualquier trabajo:**
   ```bash
   pnpm typecheck   # tsc --noEmit, cero errores
   pnpm lint        # eslint, cero errores
   pnpm test        # vitest, todos verdes
   pnpm build       # next build exitoso
   ```
   Si un gate falla, arreglarlo es parte de la tarea. Nunca reportar "listo" con gates rojos.
4. **La lógica de resolución de partidas vive en el servidor.** Nunca resolver un resultado de partida en el cliente. Nunca exponer los movimientos del rival antes de que ambos hayan commiteado.
5. **Toda mutación de coins pasa por el ledger.** Prohibido hacer `UPDATE wallets SET balance = ...` directo. Ver `docs/modelo-datos.md`.
6. **Mobile-first.** Todo se diseña primero a 390px de ancho. Desktop es la adaptación, no al revés.
7. **Español en UI, inglés en código.** Textos de interfaz en español (Paraguay), nombres de variables/tablas/funciones en inglés.

## Convenciones de código

- Next.js App Router, Server Components por defecto, `"use client"` solo cuando hay interactividad.
- Mutaciones vía Server Actions o Edge Functions de Supabase; no crear API routes salvo necesidad real (webhooks, etc.).
- Estado del cliente: empezar con React state + Realtime subscriptions. No agregar librerías de estado global sin justificarlo en `docs/decisiones-abiertas.md`.
- Componentes de HeroUI antes que componentes custom; Tailwind para layout y ajustes.
- Versiones exactas: consultar `package.json`, no asumir de memoria.

## Anti-patrones conocidos de este proyecto

- Expandir scope antes de validar el core (tendencia recurrente documentada). Si una idea nueva es buena, va a `docs/decisiones-abiertas.md` o al backlog del PRD, no al código.
- Construir meta-sistemas (editores de skins, motores de torneos genéricos) antes de que exista un juego jugable.
