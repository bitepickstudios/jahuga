-- Fase 6: misiones simples con ventana diaria y recompensa reclamable.
-- Nota vs modelo-datos.md: id text (seeds legibles) y PK con `period` (ventana
-- diaria sin resets); doc actualizado en el mismo commit.

create table public.missions (
  id text primary key,
  title text not null,
  description text,
  reward_coins bigint not null check (reward_coins > 0),
  rule jsonb not null, -- { "type": "play_matches"|"win_matches"|"win_wagered", "count": n, "window": "day" }
  is_active boolean not null default true
);

create table public.mission_progress (
  mission_id text not null references public.missions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  period date not null default current_date,
  progress int not null default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  primary key (mission_id, profile_id, period)
);

insert into public.missions (id, title, description, reward_coins, rule) values
  ('play3_day', 'Calentamiento', 'Jugá 3 partidas online hoy', 1500,
   '{"type": "play_matches", "count": 3, "window": "day"}'),
  ('win2_day', 'Doblete', 'Ganá 2 partidas online hoy', 2000,
   '{"type": "win_matches", "count": 2, "window": "day"}'),
  ('win_wager_day', 'Cazador del pozo', 'Ganá una partida apostada hoy', 3000,
   '{"type": "win_wagered", "count": 1, "window": "day"}');

-- Evento de misión (solo service role; lo llama el server al resolver partidas)
create or replace function public.fn_mission_event(p_profile uuid, p_event text)
returns void
language plpgsql security definer set search_path = public
as $$
declare m record;
begin
  for m in
    select id, (rule ->> 'count')::int as needed
    from missions
    where is_active and rule ->> 'type' = p_event
  loop
    insert into mission_progress (mission_id, profile_id, period, progress)
    values (m.id, p_profile, current_date, 1)
    on conflict (mission_id, profile_id, period)
      do update set progress = mission_progress.progress + 1
      where mission_progress.completed_at is null;

    update mission_progress
    set completed_at = now()
    where mission_id = m.id and profile_id = p_profile and period = current_date
      and completed_at is null and progress >= m.needed;
  end loop;
end;
$$;

-- Reclamo (authenticated; el actor es auth.uid())
create or replace function public.fn_claim_mission(p_mission text)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  reward bigint;
  updated int;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  select reward_coins into reward from missions where id = p_mission;
  if not found then raise exception 'Misión inexistente.'; end if;

  update mission_progress
  set claimed_at = now()
  where mission_id = p_mission and profile_id = auth.uid() and period = current_date
    and completed_at is not null and claimed_at is null;
  get diagnostics updated = row_count;
  if updated = 0 then raise exception 'Esa misión no está lista para reclamar.'; end if;

  perform _apply_tx(auth.uid(), reward, 'mission_reward', null);
  return reward;
end;
$$;

alter table public.missions enable row level security;
alter table public.mission_progress enable row level security;

create policy missions_select on public.missions for select using (is_active);
create policy mission_progress_select on public.mission_progress
  for select using (profile_id = auth.uid());

revoke execute on function public.fn_mission_event(uuid, text) from public, anon, authenticated;
grant execute on function public.fn_claim_mission(text) to authenticated;
