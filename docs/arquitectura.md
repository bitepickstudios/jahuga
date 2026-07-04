# Arquitectura — Lobby

Principio rector: **la plataforma y los minijuegos son sistemas distintos** unidos por un contrato mínimo. La plataforma no sabe cómo se juega a nada; los juegos no saben de coins, amigos ni grupos.

## Screaming architecture

La estructura grita el dominio, no el framework:

```
src/
├── app/                        # Rutas Next.js (solo composición, sin lógica)
│   ├── (auth)/                 # login, registro, onboarding
│   ├── (main)/                 # home/lobby, perfil, grupo, wallet
│   └── play/[matchId]/         # shell de partida (carga el minijuego que toque)
│
├── features/
│   ├── profiles/               # perfiles, frases, stats, privacidad
│   ├── friends/                # solicitudes, lista, links de invitación
│   ├── groups/                 # grupos, membresías
│   ├── matches/                # desafíos, ciclo de vida de partida, historial
│   ├── economy/                # wallet, ledger, apuestas/escrow, streaks, misiones
│   └── avatars/                # entidad Avatar, composición 2D, skins equipadas
│
├── games/                      # ★ Minijuegos: módulos plug-in
│   ├── sdk/                    # contrato compartido (tipos + helpers)
│   │   ├── types.ts            # GameDefinition, MatchContext, MatchOutcome
│   │   └── client.ts           # hooks: useMatchState, useCommitMove, ...
│   └── penales/
│       ├── engine/             # lógica PURA: resolveMatch(), sin imports de React/Supabase
│       ├── ui/                 # componentes del juego (selección, revelación, marcador)
│       ├── bot.ts              # estrategias del bot por dificultad
│       └── definition.ts       # implementa GameDefinition
│
├── lib/                        # supabase clients, utils
└── components/                 # UI compartida (no de dominio)

supabase/
├── migrations/                 # esquema versionado (ver modelo-datos.md)
└── functions/
    └── resolve-match/          # Edge Function: única autoridad de resolución
```

Reglas de dependencia (verificables con lint de imports):
- `games/*` importa de `games/sdk`, nunca de `features/*`.
- `features/*` nunca importa de `games/<juego>/engine` — solo del `sdk` y de `definition.ts`.
- `games/<juego>/engine` no importa React ni Supabase: **funciones puras** (por eso es 100% testeable).

## Contrato Game SDK

Lo que convierte a Lobby en plataforma. Todo minijuego implementa:

```ts
// games/sdk/types.ts
export interface GameDefinition<Move, State> {
  id: string;                       // "penales"
  name: string;                     // "Tanda de Penales"
  minPlayers: 2; maxPlayers: 2;     // v1: solo 1v1
  modes: ("live" | "async")[];

  /** Valida un movimiento antes de commitearlo (corre en server) */
  validateMove(state: State, playerId: string, move: Move): boolean;

  /** Reduce el estado — determinístico, puro */
  applyMove(state: State, playerId: string, move: Move): State;

  /** ¿Terminó? Si terminó, el resultado */
  getOutcome(state: State): MatchOutcome | null;

  initialState(players: [string, string], seed: string): State;
}

export interface MatchOutcome {
  winnerId: string | null;          // null = empate (si el juego lo permite)
  scores: Record<string, number>;
  stats: Record<string, unknown>;   // libre por juego (para perfiles/logros)
}
```

Flujo de una partida:

```
Reto creado ──► aceptado (escrow si hay apuesta)
   │
   ▼
matches.status = "active"
   │  cliente commitea movimientos ──► match_moves (RLS: no ves los del rival)
   ▼
Edge Function resolve-match:
   1. lee movimientos de ambos
   2. corre engine (applyMove/getOutcome) — determinístico
   3. escribe resultado + estado final
   4. llama a economy.settleWager() — payout atómico del escrow
   5. actualiza stats de perfiles
   ▼
matches.status = "resolved" ──► Realtime notifica a ambos clientes
                                 clientes reproducen la "repetición" penal a penal
```

Nota clave: en **modo en vivo** la revelación penal por penal es una experiencia de cliente sobre datos ya resueltos o resueltos por ronda (según `decisiones-abiertas.md §D3`); la autoridad siempre es el servidor.

## Avatar como entidad de plataforma

`features/avatars` expone un componente `<PlayerAvatar pose="kick" | "save" | "idle" />` que compone capas (foto + cuerpo + skin). Los minijuegos lo consumen; no tienen sprites propios de jugador. Cuando llegue el 3D, este componente resuelve internamente si renderiza capas 2D o un GLB — los juegos no cambian.

## Seguridad (threat model: amigos tramposos, no atacantes)

- RLS en todas las tablas; el commit oculto de movimientos es la regla crítica.
- Resolución y payout solo en servidor con service role; el cliente jamás escribe resultados ni balances.
- Rate limits suaves en transferencias de coins (límite diario) para evitar economías rotas entre cuentas del mismo humano.
