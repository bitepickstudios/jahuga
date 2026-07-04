-- Fase 3: catálogo de juegos, partidas 1v1 y commit oculto de movimientos.
-- Ver docs/modelo-datos.md y decisión D3 en docs/decisiones-abiertas.md.

-- ─────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────

create table public.games (
  id text primary key,
  name text not null,
  is_active boolean not null default true,
  supports_live boolean not null default true,
  supports_async boolean not null default true,
  sort_order int not null default 0
);

insert into public.games (id, name, sort_order) values ('penales', 'Tanda de Penales', 0);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  opponent_id uuid references public.profiles(id) on delete cascade, -- null si es vs bot
  is_vs_bot boolean not null default false,
  bot_level int,
  mode text not null check (mode in ('live', 'async')),
  status text not null default 'pending' check (status in
    ('pending', 'active', 'resolved', 'declined', 'expired', 'abandoned')),
  seed text not null default gen_random_uuid()::text,
  state jsonb,                            -- estado final (escrito solo por server)
  winner_id uuid references public.profiles(id),
  scores jsonb,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  resolved_at timestamptz,
  check (challenger_id <> opponent_id)
);

create index matches_challenger_idx on public.matches (challenger_id, status);
create index matches_opponent_idx on public.matches (opponent_id, status);

create table public.match_moves (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  round int not null check (round >= 1),
  move jsonb not null,
  created_at timestamptz not null default now(),
  unique (match_id, player_id, round)
);

create index match_moves_match_round_idx on public.match_moves (match_id, round);

-- ─────────────────────────────────────────────
-- D3: la revelación es la RLS
-- ─────────────────────────────────────────────

create or replace function public.is_match_participant(m uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from matches
    where id = m and (challenger_id = auth.uid() or opponent_id = auth.uid())
  );
$$;

-- Un movimiento del rival se puede leer si sos participante Y
-- (la partida está resuelta O ambos ya commitearon esa ronda).
create or replace function public.can_reveal_move(m uuid, r int)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_match_participant(m) and (
    exists (select 1 from matches where id = m and status = 'resolved')
    or (select count(distinct player_id) from match_moves where match_id = m and round = r) = 2
  );
$$;

-- ─────────────────────────────────────────────
-- RLS (escrituras SOLO vía Server Actions con service role)
-- ─────────────────────────────────────────────

alter table public.games enable row level security;
alter table public.matches enable row level security;
alter table public.match_moves enable row level security;

create policy games_select on public.games for select using (true);

create policy matches_select on public.matches
  for select using (challenger_id = auth.uid() or opponent_id = auth.uid());

create policy match_moves_select on public.match_moves
  for select using (
    player_id = auth.uid() or public.can_reveal_move(match_id, round)
  );

-- Sin policies de insert/update/delete para authenticated: solo el service role escribe.

-- ─────────────────────────────────────────────
-- Realtime: notificar cambios de matches y match_moves (respeta RLS)
-- ─────────────────────────────────────────────

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_moves;

-- ─────────────────────────────────────────────
-- Stats de perfil: vista materializada refrescada al resolver
-- ─────────────────────────────────────────────

create materialized view public.profile_stats as
select
  p.id as profile_id,
  m.game_id,
  count(*) as played,
  count(*) filter (where m.winner_id = p.id) as won
from public.profiles p
join public.matches m
  on m.status = 'resolved' and (m.challenger_id = p.id or m.opponent_id = p.id)
group by p.id, m.game_id;

create unique index profile_stats_pk on public.profile_stats (profile_id, game_id);

create or replace function public.refresh_profile_stats()
returns void
language sql security definer set search_path = public
as $$
  refresh materialized view concurrently public.profile_stats;
$$;

-- Las matviews no soportan RLS: son agregados no sensibles (winrate es público).
grant select on public.profile_stats to authenticated, anon;
