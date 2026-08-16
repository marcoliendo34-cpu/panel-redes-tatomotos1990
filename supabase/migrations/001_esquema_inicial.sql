-- 001 · Esquema base del panel de contenido
create extension if not exists "pgcrypto";

do $$ begin create type public.user_role as enum ('agencia','cliente');
exception when duplicate_object then null; end $$;

do $$ begin create type public.post_status as enum ('borrador','en_revision','aprobado','rechazado');
exception when duplicate_object then null; end $$;

do $$ begin create type public.social_network as enum ('instagram','tiktok','facebook','youtube','x','linkedin','whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin create type public.media_type as enum ('imagen','video');
exception when duplicate_object then null; end $$;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'cliente',
  brand_id uuid references public.brands(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,
  copy text not null default '',
  media_url text,
  media_path text,
  media_type public.media_type,
  network public.social_network not null default 'instagram',
  scheduled_at timestamptz not null,
  status public.post_status not null default 'borrador',
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_brand_scheduled_idx on public.posts (brand_id, scheduled_at);
create index if not exists posts_status_idx on public.posts (status);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  kind text not null default 'comentario' check (kind in ('comentario','aprobacion','rechazo')),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at before update on public.posts
  for each row execute function public.touch_updated_at();
