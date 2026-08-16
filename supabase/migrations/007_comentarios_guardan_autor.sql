-- 007 · Guardar nombre y rol del autor dentro del comentario
alter table public.comments add column if not exists author_name text;
alter table public.comments add column if not exists author_role public.user_role;

create or replace function public.stamp_comment_author()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_name text; v_role public.user_role;
begin
  select full_name, role into v_name, v_role from public.profiles where id = new.author_id;
  new.author_name := coalesce(new.author_name, v_name, 'Usuario');
  new.author_role := coalesce(new.author_role, v_role, 'cliente');
  return new;
end $$;

revoke all on function public.stamp_comment_author() from public, anon, authenticated;

drop trigger if exists comments_stamp_author on public.comments;
create trigger comments_stamp_author before insert on public.comments
  for each row execute function public.stamp_comment_author();
