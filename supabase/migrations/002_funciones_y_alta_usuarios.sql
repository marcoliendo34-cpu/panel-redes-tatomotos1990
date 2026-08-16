-- 002 · Funciones auxiliares y creación automática de perfiles
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.my_brand_id()
returns uuid language sql stable security definer set search_path = public
as $$ select brand_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_agencia()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()) = 'agencia', false) $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_role public.user_role; v_brand uuid;
begin
  v_role := case when new.raw_user_meta_data->>'role' = 'agencia'
                 then 'agencia'::public.user_role
                 else 'cliente'::public.user_role end;
  v_brand := coalesce(
    nullif(new.raw_user_meta_data->>'brand_id','')::uuid,
    (select id from public.brands order by created_at limit 1)
  );
  insert into public.profiles (id, email, full_name, role, brand_id)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
          v_role, v_brand)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
