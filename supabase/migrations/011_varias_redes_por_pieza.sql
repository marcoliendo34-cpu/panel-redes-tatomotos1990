-- 011 · Una pieza puede ir a varias redes
-- Se conserva la columna antigua `network` sincronizada con la primera de
-- la lista, para que una versión anterior del panel siga funcionando.
alter table public.posts
  add column if not exists networks public.social_network[] not null default '{}';

update public.posts
   set networks = array[network]
 where network is not null and cardinality(networks) = 0;

alter table public.posts alter column network drop not null;
alter table public.posts alter column network drop default;

create or replace function public.sincroniza_redes()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.networks is null or cardinality(new.networks) = 0 then
    if new.network is not null then
      new.networks := array[new.network];
    else
      new.networks := array['instagram'::public.social_network];
    end if;
  else
    new.networks := array(select distinct unnest(new.networks));
  end if;
  new.network := new.networks[1];
  return new;
end $$;

drop trigger if exists posts_sincroniza_redes on public.posts;
create trigger posts_sincroniza_redes
  before insert or update on public.posts
  for each row execute function public.sincroniza_redes();

create index if not exists posts_networks_idx on public.posts using gin (networks);
