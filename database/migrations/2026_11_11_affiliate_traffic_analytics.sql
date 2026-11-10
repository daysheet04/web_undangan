-- Tracks affiliate storefront (/ref/:code) and referral template link
-- (/template/:code?ref=:code) page views and interactive block/button clicks.
create table if not exists public.affiliate_traffic_events (
  id bigserial primary key,
  affiliate_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  event_type varchar(16) not null check (event_type in ('view', 'click')),
  page_type varchar(24) not null default 'storefront' check (page_type in ('storefront', 'template')),
  target_type varchar(32) not null default 'page_view',
  target_label varchar(160),
  template_code varchar(64),
  package_code varchar(40),
  visitor_hash char(64),
  event_date date not null default ((timezone('Asia/Jakarta', now()))::date),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_affiliate_traffic_events_aff_date
  on public.affiliate_traffic_events(affiliate_id, event_date desc, event_type);

create index if not exists idx_affiliate_traffic_events_aff_created
  on public.affiliate_traffic_events(affiliate_id, created_at desc);

create index if not exists idx_affiliate_traffic_events_dedup
  on public.affiliate_traffic_events(
    affiliate_id,
    event_type,
    page_type,
    coalesce(template_code, ''),
    visitor_hash,
    event_date
  )
  where visitor_hash is not null;

create or replace function public.get_affiliate_traffic_analytics(
  p_affiliate_id uuid,
  p_from date default null,
  p_to date default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_totals jsonb;
  v_daily jsonb;
  v_targets jsonb;
  v_years jsonb;
begin
  select coalesce(jsonb_agg(y.yr order by y.yr desc), '[]'::jsonb)
  into v_years
  from (
    select distinct extract(year from event_date)::integer as yr
    from public.affiliate_traffic_events
    where affiliate_id = p_affiliate_id
  ) y;

  select jsonb_build_object(
    'views', coalesce(sum(case when event_type = 'view' then 1 else 0 end), 0)::integer,
    'clicks', coalesce(sum(case when event_type = 'click' then 1 else 0 end), 0)::integer,
    'storefront_views', coalesce(sum(case when event_type = 'view' and page_type = 'storefront' then 1 else 0 end), 0)::integer,
    'template_views', coalesce(sum(case when event_type = 'view' and page_type = 'template' then 1 else 0 end), 0)::integer,
    'unique_viewers', count(distinct case when event_type = 'view' then visitor_hash else null end)::integer,
    'unique_clickers', count(distinct case when event_type = 'click' then visitor_hash else null end)::integer
  )
  into v_totals
  from public.affiliate_traffic_events
  where affiliate_id = p_affiliate_id
    and (p_from is null or event_date >= p_from)
    and (p_to is null or event_date <= p_to);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(d.event_date, 'YYYY-MM-DD'),
        'views', d.views,
        'clicks', d.clicks,
        'storefront_views', d.storefront_views,
        'template_views', d.template_views
      )
      order by d.event_date asc
    ),
    '[]'::jsonb
  )
  into v_daily
  from (
    select
      event_date,
      sum(case when event_type = 'view' then 1 else 0 end)::integer as views,
      sum(case when event_type = 'click' then 1 else 0 end)::integer as clicks,
      sum(case when event_type = 'view' and page_type = 'storefront' then 1 else 0 end)::integer as storefront_views,
      sum(case when event_type = 'view' and page_type = 'template' then 1 else 0 end)::integer as template_views
    from public.affiliate_traffic_events
    where affiliate_id = p_affiliate_id
      and (p_from is null or event_date >= p_from)
      and (p_to is null or event_date <= p_to)
    group by event_date
  ) d;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'event_type', t.event_type,
        'page_type', t.page_type,
        'target_type', t.target_type,
        'target_label', t.target_label,
        'template_code', t.template_code,
        'package_code', t.package_code,
        'count', t.event_count
      )
      order by t.event_count desc, t.event_type asc
    ),
    '[]'::jsonb
  )
  into v_targets
  from (
    select
      event_type,
      page_type,
      target_type,
      coalesce(nullif(trim(target_label), ''), target_type) as target_label,
      nullif(trim(coalesce(template_code, '')), '') as template_code,
      nullif(trim(coalesce(package_code, '')), '') as package_code,
      count(*)::integer as event_count,
      max(created_at) as last_seen_at
    from public.affiliate_traffic_events
    where affiliate_id = p_affiliate_id
      and (p_from is null or event_date >= p_from)
      and (p_to is null or event_date <= p_to)
    group by
      event_type,
      page_type,
      target_type,
      coalesce(nullif(trim(target_label), ''), target_type),
      nullif(trim(coalesce(template_code, '')), ''),
      nullif(trim(coalesce(package_code, '')), '')
    order by event_count desc, last_seen_at desc
    limit 50
  ) t;

  return jsonb_build_object(
    'available_years', v_years,
    'totals', v_totals,
    'daily', v_daily,
    'targets', v_targets
  );
end;
$$;

alter table public.affiliate_traffic_events enable row level security;
revoke all on public.affiliate_traffic_events from public, anon, authenticated;
grant select, insert, delete on public.affiliate_traffic_events to service_role;
grant usage, select on sequence public.affiliate_traffic_events_id_seq to service_role;

revoke all on function public.get_affiliate_traffic_analytics(uuid, date, date) from public, anon, authenticated;
grant execute on function public.get_affiliate_traffic_analytics(uuid, date, date) to service_role;

notify pgrst, 'reload schema';
