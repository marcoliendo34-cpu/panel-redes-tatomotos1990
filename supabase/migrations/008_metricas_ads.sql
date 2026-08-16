-- 008 · Métricas de publicidad pagada
create table if not exists public.metricas_ads (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  fecha date not null,
  campana text not null,
  plataforma text not null default 'Meta Ads',
  inversion numeric(14,2) not null default 0,
  moneda text not null default 'USD',
  alcance bigint not null default 0,
  clics bigint not null default 0,
  resultados bigint not null default 0,
  tipo_resultado text,
  costo_por_clic numeric(14,4) generated always as (
    case when clics > 0 then inversion / clics end ) stored,
  costo_por_resultado numeric(14,4) generated always as (
    case when resultados > 0 then inversion / resultados end ) stored,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists metricas_ads_unica
  on public.metricas_ads (brand_id, fecha, campana, plataforma);
create index if not exists metricas_ads_brand_fecha_idx
  on public.metricas_ads (brand_id, fecha desc);

drop trigger if exists metricas_ads_touch_updated_at on public.metricas_ads;
create trigger metricas_ads_touch_updated_at before update on public.metricas_ads
  for each row execute function public.touch_updated_at();

alter table public.metricas_ads enable row level security;

drop policy if exists "metricas_all_agencia" on public.metricas_ads;
create policy "metricas_all_agencia" on public.metricas_ads for all to authenticated
  using ( public.is_agencia() ) with check ( public.is_agencia() );

drop policy if exists "metricas_select_cliente" on public.metricas_ads;
create policy "metricas_select_cliente" on public.metricas_ads for select to authenticated
  using ( brand_id = public.my_brand_id() );
