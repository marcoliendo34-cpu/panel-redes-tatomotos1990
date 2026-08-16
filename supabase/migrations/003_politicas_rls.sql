-- 003 · Seguridad por filas
alter table public.brands   enable row level security;
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

drop policy if exists "brands_select" on public.brands;
create policy "brands_select" on public.brands for select to authenticated
  using ( public.is_agencia() or id = public.my_brand_id() );

drop policy if exists "brands_write_agencia" on public.brands;
create policy "brands_write_agencia" on public.brands for all to authenticated
  using ( public.is_agencia() ) with check ( public.is_agencia() );

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using ( id = auth.uid() or public.is_agencia() );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ( id = auth.uid() ) with check ( id = auth.uid() );

drop policy if exists "profiles_manage_agencia" on public.profiles;
create policy "profiles_manage_agencia" on public.profiles for all to authenticated
  using ( public.is_agencia() ) with check ( public.is_agencia() );

drop policy if exists "posts_all_agencia" on public.posts;
create policy "posts_all_agencia" on public.posts for all to authenticated
  using ( public.is_agencia() ) with check ( public.is_agencia() );

drop policy if exists "posts_select_cliente" on public.posts;
create policy "posts_select_cliente" on public.posts for select to authenticated
  using ( brand_id = public.my_brand_id() and status <> 'borrador' );

drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select to authenticated
  using ( public.is_agencia() or exists (
    select 1 from public.posts p where p.id = comments.post_id
      and p.brand_id = public.my_brand_id() and p.status <> 'borrador' ) );

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments for insert to authenticated
  with check ( author_id = auth.uid() and ( public.is_agencia() or exists (
    select 1 from public.posts p where p.id = comments.post_id
      and p.brand_id = public.my_brand_id() and p.status <> 'borrador' ) ) );

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete to authenticated
  using ( author_id = auth.uid() or public.is_agencia() );
