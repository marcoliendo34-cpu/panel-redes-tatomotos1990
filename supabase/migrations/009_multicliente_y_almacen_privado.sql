-- 009 · Varios clientes y almacén privado

-- Identidad visual por marca
alter table public.brands add column if not exists color_acento text not null default '#f4f4f7';
alter table public.brands add column if not exists activo boolean not null default true;

insert into public.brands (name, slug) values
  ('TATO MOTOS 1990 C.A.', 'tato-motos'),
  ('KAYRO MOTO PARTS',     'kayro-moto'),
  ('GO CAUCHOS 0516 C.A.', 'go-cauchos')
on conflict (slug) do update set name = excluded.name;

-- Un usuario nuevo ya NO hereda "la primera marca": queda sin marca
-- hasta que se le asigne una a propósito.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_role public.user_role; v_brand uuid;
begin
  v_role := case when new.raw_user_meta_data->>'role' = 'agencia'
                 then 'agencia'::public.user_role
                 else 'cliente'::public.user_role end;
  v_brand := nullif(new.raw_user_meta_data->>'brand_id','')::uuid;
  insert into public.profiles (id, email, full_name, role, brand_id)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
          v_role, v_brand)
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Nadie que no sea agencia puede cambiarse el rol ni la marca
create or replace function public.protege_rol_y_marca()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_agencia() then
    new.role     := old.role;
    new.brand_id := old.brand_id;
  end if;
  return new;
end $$;
revoke all on function public.protege_rol_y_marca() from public, anon, authenticated;

drop trigger if exists profiles_protege_rol on public.profiles;
create trigger profiles_protege_rol before update on public.profiles
  for each row execute function public.protege_rol_y_marca();

-- El almacén deja de ser público: cada cliente solo lee su carpeta
update storage.buckets set public = false where id = 'contenido';

drop policy if exists "contenido_lectura" on storage.objects;
create policy "contenido_lectura" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'contenido'
    and ( public.is_agencia()
          or (storage.foldername(name))[1] = public.my_brand_id()::text )
  );
