-- Repair v3 de grupos — a prueba de rollbacks.
-- El v2 probablemente falló en el drop del event trigger y TODO se revirtió.
-- Acá cada paso peligroso va en su propio bloque con EXCEPTION: nada aborta el resto.
-- AL FINAL devuelve un diagnóstico: si algo sigue raro, pasame esa tabla.

-- ─── 1. Intentar matar/deshabilitar el auto-fix (best effort) ───
do $$
declare et record;
begin
  for et in
    select evtname from pg_event_trigger
    where evtfoid::regproc::text ilike '%rls_auto%'
  loop
    begin
      execute format('drop event trigger %I', et.evtname);
      raise notice 'event trigger ELIMINADO: %', et.evtname;
    exception when others then
      begin
        execute format('alter event trigger %I disable', et.evtname);
        raise notice 'event trigger DESHABILITADO: %', et.evtname;
      exception when others then
        raise notice 'no pude tocar el event trigger %: %', et.evtname, sqlerrm;
      end;
    end;
  end loop;
end $$;

do $$
begin
  begin
    drop function if exists public.rls_auto_enable() cascade;
    raise notice 'función rls_auto_enable() eliminada';
  exception when others then
    raise notice 'no pude eliminar rls_auto_enable(): %', sqlerrm;
  end;
end $$;

-- ─── 2. Reparación de grupos (cada paso aislado) ───
do $$
begin
  begin
    alter table public.groups no force row level security;
    alter table public.group_members no force row level security;
    raise notice 'FORCE RLS desactivado';
  exception when others then
    raise notice 'no pude desactivar FORCE: %', sqlerrm;
  end;

  alter table public.groups enable row level security;
  alter table public.group_members enable row level security;

  declare pol record;
  begin
    for pol in
      select policyname, tablename from pg_policies
      where schemaname = 'public' and tablename in ('groups', 'group_members')
    loop
      execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
    end loop;
    raise notice 'policies previas eliminadas';
  end;
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

-- ─── 3. Diagnóstico final: pasame esta tabla si grupos sigue roto ───
select 'tabla' as tipo, c.relname as objeto,
       'rls=' || c.relrowsecurity || ' force=' || c.relforcerowsecurity as detalle
from pg_class c
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
where c.relname in ('groups', 'group_members')
union all
select 'policy', tablename, policyname || ' → ' || coalesce(qual, '(sin qual)')
from pg_policies
where schemaname = 'public' and tablename in ('groups', 'group_members')
union all
select 'event_trigger', evtname, evtfoid::regproc::text || ' [' || evtenabled || ']'
from pg_event_trigger
order by 1, 2;
