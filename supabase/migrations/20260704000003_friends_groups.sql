-- Fase 4: grupos + refuerzos de amistades.
-- friendships ya existe (migración 1). Ver docs/modelo-datos.md.

-- ─────────────────────────────────────────────
-- Grupos
-- ─────────────────────────────────────────────

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  description text,
  image_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create index group_members_profile_idx on public.group_members (profile_id);

create or replace function public.is_group_member(g uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from group_members where group_id = g and profile_id = auth.uid()
  );
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Solo los miembros ven su grupo; escrituras solo vía Server Actions (service role).
create policy groups_select on public.groups
  for select using (public.is_group_member(id));

create policy group_members_select on public.group_members
  for select using (public.is_group_member(group_id));

-- ─────────────────────────────────────────────
-- Visibilidad de perfil: los compañeros de grupo se ven entre sí
-- (además de público / dueño / amigos — migración 1)
-- ─────────────────────────────────────────────

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

-- ─────────────────────────────────────────────
-- Amistades: permitir borrar (cancelar solicitud / dejar de ser amigos)
-- ─────────────────────────────────────────────

create policy friendships_delete on public.friendships
  for delete using (requester_id = auth.uid() or addressee_id = auth.uid());
