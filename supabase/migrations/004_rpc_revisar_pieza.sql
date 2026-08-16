-- 004 · Aprobar / rechazar / comentar (única puerta de escritura para el cliente)
create or replace function public.review_post(
  p_post_id uuid, p_action text, p_message text default null
) returns public.posts
language plpgsql security definer set search_path = public
as $$
declare
  v_post public.posts; v_brand uuid;
  v_msg text := nullif(btrim(coalesce(p_message,'')), '');
  v_kind text;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.'; end if;
  if p_action not in ('aprobar','rechazar','comentar') then
    raise exception 'Acción no válida: %', p_action; end if;

  select * into v_post from public.posts where id = p_post_id;
  if not found then raise exception 'La pieza no existe.'; end if;

  if not public.is_agencia() then
    v_brand := public.my_brand_id();
    if v_post.brand_id is distinct from v_brand then
      raise exception 'No tienes acceso a esta pieza.'; end if;
    if v_post.status = 'borrador' then
      raise exception 'Esta pieza todavía es un borrador y no está lista para revisión.'; end if;
  end if;

  if p_action = 'rechazar' and v_msg is null then
    raise exception 'Para rechazar una pieza debes indicar el motivo.'; end if;
  if p_action = 'comentar' and v_msg is null then
    raise exception 'El comentario no puede estar vacío.'; end if;

  if p_action = 'aprobar' then
    update public.posts set status='aprobado', rejection_reason=null,
      reviewed_by=auth.uid(), reviewed_at=now()
      where id=p_post_id returning * into v_post;
    v_kind := 'aprobacion';
  elsif p_action = 'rechazar' then
    update public.posts set status='rechazado', rejection_reason=v_msg,
      reviewed_by=auth.uid(), reviewed_at=now()
      where id=p_post_id returning * into v_post;
    v_kind := 'rechazo';
  else
    v_kind := 'comentario';
  end if;

  if v_msg is not null then
    insert into public.comments (post_id, author_id, body, kind)
    values (p_post_id, auth.uid(), v_msg, v_kind);
  end if;

  return v_post;
end $$;

revoke all on function public.review_post(uuid, text, text) from public, anon;
grant execute on function public.review_post(uuid, text, text) to authenticated;
