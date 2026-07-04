-- Fase 2: profiles, friendships (esquema para RLS; UI en F4), avatars, storage.
-- Ver docs/modelo-datos.md. RLS activa desde el día 1.

-- ─────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  display_name text,
  birth_date date, -- edad derivada, nunca almacenada
  photo_url text,
  is_public boolean not null default true,
  iconic_phrases text[] not null default '{}',
  invite_code text unique not null default gen_random_uuid()::text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Unicidad case-insensitive del nickname
create unique index profiles_nickname_lower_idx on public.profiles (lower(nickname));

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- Un solo vínculo por par, sin importar dirección
create unique index friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table public.avatars (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  kind text not null default '2d_layers' check (kind in ('2d_layers', 'glb')),
  photo_crop_url text,
  glb_url text, -- futuro 3D (Ready Player Me)
  equipped jsonb not null default '{}'
);

-- ─────────────────────────────────────────────
-- Funciones auxiliares (security definer: evitan recursión de RLS)
-- ─────────────────────────────────────────────

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

create or replace function public.can_view_profile(p uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = p
      and (is_public or id = auth.uid() or public.are_friends(id, auth.uid()))
  );
$$;

-- ─────────────────────────────────────────────
-- Trigger: alta de usuario → profile + avatar
-- ─────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, nickname, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'display_name'
  );
  insert into avatars (profile_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.avatars enable row level security;

create policy profiles_select on public.profiles
  for select using (public.can_view_profile(id));

create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- D4: nickname NO editable en v1; invite_code/created_at tampoco.
revoke update on table public.profiles from authenticated, anon;
grant update (display_name, birth_date, photo_url, is_public, iconic_phrases, onboarding_completed)
  on table public.profiles to authenticated;

create policy friendships_select on public.friendships
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy friendships_insert on public.friendships
  for insert with check (requester_id = auth.uid() and status = 'pending');

-- Solo el destinatario resuelve la solicitud
create policy friendships_update on public.friendships
  for update using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());

create policy avatars_select on public.avatars
  for select using (public.can_view_profile(profile_id));

create policy avatars_update on public.avatars
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ─────────────────────────────────────────────
-- Storage: bucket de fotos (lectura pública, escritura solo en carpeta propia)
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
