# Modelo de datos — Lobby

Postgres (Supabase). Esquema pensado para v1 pero con las entidades futuras (grupos vs grupos, avatar 3D, N minijuegos) ya contempladas para no migrar dolorosamente después. RLS activa en todo desde el día 1.

## Diagrama de entidades

```
profiles ──< friendships >── profiles
profiles ──< group_members >── groups
profiles ──1 avatars ──< avatar_items (equipadas)
profiles ──1 wallets ──< coin_transactions (ledger)
profiles ──< matches >── profiles
matches ──< match_moves
matches ──1 wagers
games (catálogo) ──< matches
missions ──< mission_progress >── profiles
```

## Tablas

### profiles
```sql
create table profiles (
  id uuid primary key references auth.users(id),
  nickname text unique not null,          -- citext o lower-index para unicidad case-insensitive
  display_name text,
  birth_date date,                        -- edad derivada, nunca almacenada
  photo_url text,
  is_public boolean default true,
  iconic_phrases text[] default '{}',
  invite_code text unique default gen_random_uuid(),  -- link de invitación de amistad
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);
```
RLS: perfil visible si `is_public`, si sos vos, o si existe amistad aceptada.

### friendships
```sql
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id),
  addressee_id uuid references profiles(id),
  status text check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz default now(),
  unique (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
);
```

### groups y group_members
```sql
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  owner_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table group_members (
  group_id uuid references groups(id),
  profile_id uuid references profiles(id),
  role text check (role in ('owner','member')) default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, profile_id)
);
```
v1 limita a 1 grupo por usuario **en la app**, no en el esquema (la visión grupo-vs-grupo necesita N).

### games (catálogo de minijuegos)
```sql
create table games (
  id text primary key,                    -- "penales"
  name text not null,
  is_active boolean default true,
  supports_live boolean default true,
  supports_async boolean default true,
  sort_order int default 0                -- orden del scroll vertical del home
);
```

### matches
```sql
create table matches (
  id uuid primary key default gen_random_uuid(),
  game_id text references games(id),
  challenger_id uuid references profiles(id),
  opponent_id uuid references profiles(id),   -- null si es vs bot
  is_vs_bot boolean default false,
  bot_level int,
  mode text check (mode in ('live','async')),
  status text check (status in
    ('pending',      -- reto enviado
     'active',       -- aceptado, en juego
     'resolved',     -- terminada con resultado
     'declined','expired','abandoned')) default 'pending',
  seed text not null default gen_random_uuid()::text,  -- para determinismo del engine
  state jsonb,                            -- estado final (escrito solo por server)
  winner_id uuid references profiles(id),
  scores jsonb,
  created_at timestamptz default now(),
  resolved_at timestamptz
);
```

### match_moves — el commit oculto
```sql
create table match_moves (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id),
  player_id uuid references profiles(id),
  round int not null,                     -- penal 1..5 (o muerte súbita 6+)
  move jsonb not null,                    -- { kick: 'left'|'center'|'right', save: ... } según spec
  created_at timestamptz default now(),
  unique (match_id, player_id, round)
);
```
**RLS crítica:** un jugador puede `insert` sus propias filas y `select` solo (a) sus propias filas, y (b) filas del rival cuyo `round` ya esté revelado (partida `resolved`, o ronda cerrada en modo en vivo — la revelación la marca el server). Test automatizado obligatorio de esta política (roadmap F3).

### Economía: wallets + ledger

```sql
create table wallets (
  profile_id uuid primary key references profiles(id),
  balance bigint not null default 0 check (balance >= 0)
);

create table coin_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references wallets(profile_id),
  amount bigint not null,                 -- positivo entra, negativo sale
  kind text check (kind in
    ('welcome_bonus','wager_escrow','wager_payout','wager_refund',
     'transfer_in','transfer_out','streak_reward','mission_reward',
     'coupon','skin_purchase','admin_adjustment')) not null,
  ref_id uuid,                            -- match_id, transfer id, etc.
  created_at timestamptz default now()
);
```

**Regla de oro:** `wallets.balance` solo lo mutan funciones de base de datos (`security definer`) que insertan la transacción y actualizan el saldo **en la misma transacción**. El cliente no tiene `update` sobre `wallets` ni `insert` sobre `coin_transactions`. Invariante testeable: `balance = sum(amount)` del ledger de esa wallet, siempre.

```sql
create table wagers (
  match_id uuid primary key references matches(id),
  amount bigint not null check (amount > 0),
  escrowed_at timestamptz,
  settled_at timestamptz
);
```
Flujo: al aceptar → `wager_escrow` (−amount a cada uno); al resolver → `wager_payout` (+2×amount al ganador); abandono/expiración → `wager_refund` según reglas de `minijuego-penales.md §7`.

### Misiones y rachas
```sql
create table missions (
  id text primary key,                    -- 'win2_day' (ids legibles para seeds)
  title text, description text,
  reward_coins bigint not null,
  rule jsonb not null,                    -- { type: 'win_matches', count: 2, window: 'day' }
  is_active boolean default true
);

create table mission_progress (
  mission_id text references missions(id),
  profile_id uuid references profiles(id),
  period date not null default current_date,  -- ventana diaria sin resets
  progress int default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  primary key (mission_id, profile_id, period)
);

create table streaks (
  profile_id uuid primary key references profiles(id),
  current_days int default 0,
  last_check_in date
);
```

### Avatares y skins
```sql
create table avatars (
  profile_id uuid primary key references profiles(id),
  kind text check (kind in ('2d_layers','glb')) default '2d_layers',
  photo_crop_url text,                    -- cara recortada (v1)
  glb_url text,                           -- futuro 3D (Ready Player Me)
  equipped jsonb default '{}'             -- { body: 'default', skin: 'red_kit', celebration: null }
);

create table skins (
  id text primary key,                    -- 'red_kit'
  name text, kind text,                   -- 'kit' | 'celebration' | 'accessory'
  price_coins bigint,                     -- null = no comprable (drop/regalo)
  asset_ref text                          -- ruta del asset 2D; futuro: variante 3D
);

create table skin_ownership (
  profile_id uuid references profiles(id),
  skin_id text references skins(id),
  acquired_at timestamptz default now(),
  primary key (profile_id, skin_id)
);
```

## Stats de perfil

No se almacenan como columnas: se derivan de `matches` con una **vista materializada** (`profile_stats`: jugadas, ganadas, winrate por `game_id`, racha de victorias) refrescada al resolver partidas. Evita el clásico bug de contadores desincronizados.
