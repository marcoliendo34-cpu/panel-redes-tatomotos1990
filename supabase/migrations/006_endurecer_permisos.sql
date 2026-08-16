-- 006 · Cerrar permisos que Supabase deja abiertos por defecto
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.my_role()     from public, anon;
revoke all on function public.my_brand_id() from public, anon;
revoke all on function public.is_agencia()  from public, anon;

grant execute on function public.my_role()     to authenticated;
grant execute on function public.my_brand_id() to authenticated;
grant execute on function public.is_agencia()  to authenticated;
