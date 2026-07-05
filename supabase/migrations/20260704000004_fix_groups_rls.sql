-- Reparación F4: algo (¿auto-fix de RLS del dashboard? existe una función
-- rls_auto_enable que no es nuestra) dejó las tablas de grupos con policies
-- ajenas y/o FORCE RLS, bloqueando a los propios miembros.
-- Este script es idempotente: limpia TODAS las policies de groups/group_members
-- y recrea las canónicas de la migración 3.

-- FORCE RLS rompe las funciones security definer (el owner también queda sujeto)
alter table public.groups no force row level security;
alter table public.group_members no force row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Fuera toda policy existente en estas dos tablas (nuestras o del auto-fix)
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

-- Funciones canónicas (reafirmadas por si el auto-fix las tocó)
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

-- Policies canónicas: solo miembros leen; escrituras solo service role
create policy groups_select on public.groups
  for select using (public.is_group_member(id));

create policy group_members_select on public.group_members
  for select using (public.is_group_member(group_id));

-- Verificación rápida (debería devolver 2 filas):
-- select tablename, policyname from pg_policies where tablename in ('groups','group_members');
