-- Fase 5: economía de Coins — ledger inmutable, apuestas con escrow, rachas,
-- transferencias y skins. Ver docs/modelo-datos.md y D1/D2 en decisiones-abiertas.
-- REGLA DE ORO: wallets.balance solo lo mutan las funciones de acá (mismo tx que
-- el insert al ledger). El cliente no escribe wallets ni coin_transactions.
-- Valores de D2 espejados en src/features/economy/config.ts (solo display).

-- ─────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────

create table public.wallets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0)
);

create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(profile_id) on delete cascade,
  amount bigint not null, -- positivo entra, negativo sale
  kind text not null check (kind in
    ('welcome_bonus', 'wager_escrow', 'wager_payout', 'wager_refund',
     'transfer_in', 'transfer_out', 'streak_reward', 'mission_reward',
     'coupon', 'skin_purchase', 'admin_adjustment')),
  ref_id uuid, -- match_id, id de transferencia, etc.
  created_at timestamptz not null default now()
);

create index coin_transactions_wallet_idx on public.coin_transactions (wallet_id, created_at desc);

create table public.wagers (
  match_id uuid primary key references public.matches(id) on delete cascade,
  amount bigint not null check (amount > 0),
  escrowed_at timestamptz,
  settled_at timestamptz
);

create table public.streaks (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  current_days int not null default 0,
  last_check_in date
);

create table public.skins (
  id text primary key,
  name text not null,
  kind text not null default 'kit' check (kind in ('kit', 'celebration', 'accessory')),
  price_coins bigint, -- null = no comprable (drop/regalo)
  asset_ref text not null
);

create table public.skin_ownership (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skin_id text not null references public.skins(id),
  acquired_at timestamptz not null default now(),
  primary key (profile_id, skin_id)
);

insert into public.skins (id, name, price_coins, asset_ref) values
  ('albirroja', 'Albirroja', null, 'kit:albirroja'),        -- default, de regalo
  ('azulgrana', 'Azulgrana', 25000, 'kit:azulgrana'),
  ('franjeada', 'Franjeada', 25000, 'kit:franjeada'),
  ('selva', 'Selva', 50000, 'kit:selva'),
  ('violeta', 'Violeta Neón', 75000, 'kit:violeta'),
  ('dorada', 'Dorada', 100000, 'kit:dorada');

-- ─────────────────────────────────────────────
-- Primitiva interna: asiento + saldo en la MISMA transacción
-- ─────────────────────────────────────────────

create or replace function public._apply_tx(p_wallet uuid, p_amount bigint, p_kind text, p_ref uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into coin_transactions (wallet_id, amount, kind, ref_id)
  values (p_wallet, p_amount, p_kind, p_ref);
  update wallets set balance = balance + p_amount where profile_id = p_wallet;
  if not found then
    raise exception 'wallet inexistente: %', p_wallet;
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- Funciones de sistema (solo service role, las llama el servidor)
-- ─────────────────────────────────────────────

create or replace function public.fn_grant_coins(p_profile uuid, p_amount bigint, p_kind text, p_ref uuid default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_amount <= 0 then raise exception 'monto inválido'; end if;
  perform _apply_tx(p_profile, p_amount, p_kind, p_ref);
end;
$$;

create or replace function public.fn_escrow_wager(p_match uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  w record;
  m record;
begin
  select * into w from wagers where match_id = p_match for update;
  if not found then return; end if; -- partida amistosa
  if w.escrowed_at is not null then return; end if; -- idempotente

  select challenger_id, opponent_id into m from matches where id = p_match;
  -- El check balance >= 0 de wallets corta acá si a alguien no le alcanza
  perform _apply_tx(m.challenger_id, -w.amount, 'wager_escrow', p_match);
  perform _apply_tx(m.opponent_id, -w.amount, 'wager_escrow', p_match);
  update wagers set escrowed_at = now() where match_id = p_match;
end;
$$;

create or replace function public.fn_settle_wager(p_match uuid, p_winner uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare w record;
begin
  select * into w from wagers where match_id = p_match for update;
  if not found or w.escrowed_at is null or w.settled_at is not null then return; end if;
  perform _apply_tx(p_winner, w.amount * 2, 'wager_payout', p_match);
  update wagers set settled_at = now() where match_id = p_match;
end;
$$;

create or replace function public.fn_refund_wager(p_match uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  w record;
  m record;
begin
  select * into w from wagers where match_id = p_match for update;
  if not found or w.escrowed_at is null or w.settled_at is not null then return; end if;
  select challenger_id, opponent_id into m from matches where id = p_match;
  perform _apply_tx(m.challenger_id, w.amount, 'wager_refund', p_match);
  perform _apply_tx(m.opponent_id, w.amount, 'wager_refund', p_match);
  update wagers set settled_at = now() where match_id = p_match;
end;
$$;

-- ─────────────────────────────────────────────
-- Funciones de usuario (expuestas a authenticated; el actor es auth.uid())
-- ─────────────────────────────────────────────

create or replace function public.fn_transfer(p_to uuid, p_amount bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  sent_today bigint;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  if p_amount <= 0 then raise exception 'El monto tiene que ser positivo.'; end if;
  if p_to = auth.uid() then raise exception 'No podés transferirte a vos mismo.'; end if;

  -- Límite diario (D2): 20.000 por día calendario UTC
  select coalesce(-sum(amount), 0) into sent_today
  from coin_transactions
  where wallet_id = auth.uid() and kind = 'transfer_out' and created_at::date = current_date;
  if sent_today + p_amount > 20000 then
    raise exception 'Superás el límite diario de 20.000 Coins (llevás % hoy).', sent_today;
  end if;

  perform _apply_tx(auth.uid(), -p_amount, 'transfer_out', p_to);
  perform _apply_tx(p_to, p_amount, 'transfer_in', auth.uid());
end;
$$;

create or replace function public.fn_streak_checkin()
returns table (days int, reward bigint)
language plpgsql security definer set search_path = public
as $$
declare
  s record;
  new_days int;
  r bigint;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  select * into s from streaks where profile_id = auth.uid() for update;
  if not found then
    insert into streaks (profile_id, current_days, last_check_in) values (auth.uid(), 1, current_date);
    new_days := 1;
  elsif s.last_check_in = current_date then
    return query select s.current_days, 0::bigint; -- ya reclamada hoy
    return;
  elsif s.last_check_in = current_date - 1 then
    new_days := s.current_days + 1;
    update streaks set current_days = new_days, last_check_in = current_date where profile_id = auth.uid();
  else
    new_days := 1;
    update streaks set current_days = 1, last_check_in = current_date where profile_id = auth.uid();
  end if;

  -- D2: 500 × día de racha, tope 5.000
  r := least(new_days * 500, 5000);
  perform _apply_tx(auth.uid(), r, 'streak_reward', null);
  return query select new_days, r;
end;
$$;

create or replace function public.fn_buy_skin(p_skin text)
returns void
language plpgsql security definer set search_path = public
as $$
declare price bigint;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  select price_coins into price from skins where id = p_skin;
  if not found or price is null then raise exception 'Esa skin no está a la venta.'; end if;
  if exists (select 1 from skin_ownership where profile_id = auth.uid() and skin_id = p_skin) then
    raise exception 'Ya tenés esa skin.';
  end if;
  perform _apply_tx(auth.uid(), -price, 'skin_purchase', null);
  insert into skin_ownership (profile_id, skin_id) values (auth.uid(), p_skin);
end;
$$;

-- ─────────────────────────────────────────────
-- Alta de wallet + bono de bienvenida (trigger en profiles) y retroactivo
-- ─────────────────────────────────────────────

create or replace function public.handle_new_wallet()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into wallets (profile_id) values (new.id);
  perform _apply_tx(new.id, 10000, 'welcome_bonus', null); -- D2
  insert into skin_ownership (profile_id, skin_id) values (new.id, 'albirroja');
  return new;
end;
$$;

create trigger on_profile_created_wallet
  after insert on public.profiles
  for each row execute function public.handle_new_wallet();

-- Retroactivo para los usuarios que ya existen
do $$
declare p record;
begin
  for p in select id from public.profiles where id not in (select profile_id from public.wallets) loop
    insert into public.wallets (profile_id) values (p.id);
    perform public._apply_tx(p.id, 10000, 'welcome_bonus', null);
    insert into public.skin_ownership (profile_id, skin_id)
    values (p.id, 'albirroja') on conflict do nothing;
  end loop;
end $$;

-- ─────────────────────────────────────────────
-- RLS: lectura de lo propio; escritura SOLO por funciones
-- ─────────────────────────────────────────────

alter table public.wallets enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.wagers enable row level security;
alter table public.streaks enable row level security;
alter table public.skins enable row level security;
alter table public.skin_ownership enable row level security;

create policy wallets_select on public.wallets
  for select using (profile_id = auth.uid());

create policy coin_transactions_select on public.coin_transactions
  for select using (wallet_id = auth.uid());

create policy wagers_select on public.wagers
  for select using (public.is_match_participant(match_id));

create policy streaks_select on public.streaks
  for select using (profile_id = auth.uid());

create policy skins_select on public.skins for select using (true);

create policy skin_ownership_select on public.skin_ownership
  for select using (profile_id = auth.uid());

-- Las funciones de sistema no se ejecutan desde el cliente
revoke execute on function public._apply_tx(uuid, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function public.fn_grant_coins(uuid, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function public.fn_escrow_wager(uuid) from public, anon, authenticated;
revoke execute on function public.fn_settle_wager(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.fn_refund_wager(uuid) from public, anon, authenticated;
-- Las de usuario sí (el actor sale de auth.uid())
grant execute on function public.fn_transfer(uuid, bigint) to authenticated;
grant execute on function public.fn_streak_checkin() to authenticated;
grant execute on function public.fn_buy_skin(text) to authenticated;
