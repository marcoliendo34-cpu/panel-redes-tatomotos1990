-- 005 · Bucket de archivos y marca inicial
insert into storage.buckets (id, name, public, file_size_limit)
values ('contenido', 'contenido', true, 104857600)
on conflict (id) do update set public = true, file_size_limit = 104857600;

drop policy if exists "contenido_lectura" on storage.objects;
create policy "contenido_lectura" on storage.objects
  for select using ( bucket_id = 'contenido' );

drop policy if exists "contenido_subir_agencia" on storage.objects;
create policy "contenido_subir_agencia" on storage.objects for insert to authenticated
  with check ( bucket_id = 'contenido' and public.is_agencia() );

drop policy if exists "contenido_actualizar_agencia" on storage.objects;
create policy "contenido_actualizar_agencia" on storage.objects for update to authenticated
  using ( bucket_id = 'contenido' and public.is_agencia() )
  with check ( bucket_id = 'contenido' and public.is_agencia() );

drop policy if exists "contenido_borrar_agencia" on storage.objects;
create policy "contenido_borrar_agencia" on storage.objects for delete to authenticated
  using ( bucket_id = 'contenido' and public.is_agencia() );

insert into public.brands (name, slug)
values ('TATO MOTOS 1990 C.A.', 'tato-motos')
on conflict (slug) do nothing;
