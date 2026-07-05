-- Repair v2: el primer repair no alcanzó porque hay un EVENT TRIGGER ajeno
-- (rls_auto_enable) que se dispara con cada DDL y vuelve a pisar las policies.
-- Orden: 1) matar el trigger y su función, 2) reparar groups/group_members,
-- 3) reportar el estado final.

-- ─── 1. Eliminar el auto-fix ───────────────────────────────
do $$
declare et record;
begin
  -- Cualquier event trigger cuya función mencione rls_auto_enable
  for et in
    select evtname
    from pg_event_trigger
    where evtfoid::regproc::text ilike '%rls_auto_enable%'
  loop
    execute format('drop event trigger if exists %I cascade', et.evtname);
    raise notice 'event trigger eliminado: %', et.evtname;
  end loop;

  -- Y por las dudas: todo event trigger no-interno que no sea de supabase
  for et in
    select evtname, evtfoid::regproc::text as fn
    from pg_event_trigger
    where evtname not like 'pgrst%'      -- PostgREST (interno de Supabase)
      and evtname not like 'pg_%'
      and evtfoid::regproc::text not like 'extensions.%'
      and evtfoid::regproc::text not like 'realtime.%'
      and evtfoid::regproc::text not like 'supabase_%'
  loop
    raise notice 'event trigger sospechoso presente: % (función %)', et.evtname, et.fn;
  end loop;
end $$;

drop function if exists public.rls_auto_enable() cascade;
drop function if exists public.rls_auto_enable(text) cascade;

-- ─── 2. Reparación de grupos (idéntica al repair v1) ───────
alter table public.groups no force row level security;
alter table public.group_members no force row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename in ('groups', 'group_members')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

create or replace function public.is_group_member(g uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from group_members where group_id = g and profile_id = auth.uid()
  );
$$;

create or replace function public.can_view_profile(p uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = p
      and (
        is_public
        or id = auth.uid()
        or public.are_friends(id, auth.uid())
        or exists (
          select 1
          from group_members gm1
          join group_members gm2 on gm1.group_id = gm2.group_id
          where gm1.profile_id = p and gm2.profile_id = auth.uid()
        )
      )
  );
$$;

create policy groups_select on public.groups
  for select using (public.is_group_member(id));

create policy group_members_select on public.group_members
  for select using (public.is_group_member(group_id));

-- ─── 3. Reporte final (esto es lo que devuelve el editor) ──
select
  c.relname as tabla,
  c.relrowsecurity as rls,
  c.relforcerowsecurity as force_rls,
  coalesce(p.policyname, '(sin policy)') as policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
left join pg_policies p on p.tablename = c.relname and p.schemaname = 'public'
where c.relname in ('groups', 'group_members')
order by 1, 4;
