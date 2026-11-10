-- Admin aggregation helper for viewing affiliate Views & Clicks analytics
-- filtered by optional date range (and year via p_from / p_to).
create index if not exists idx_affiliate_traffic_events_date_aff
  on public.affiliate_traffic_events(event_date desc, affiliate_id, event_type);

create or replace function public.get_admin_affiliate_traffic(
  p_from date default null,
  p_to date default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_years jsonb;
  v_totals jsonb;
  v_affiliates jsonb;
begin
  select coalesce(jsonb_agg(y.yr order by y.yr desc), '[]'::jsonb)
  into v_years
  from (
    select distinct extract(year from event_date)::integer as yr
    from public.affiliate_traffic_events
  ) y;

  with filtered_affiliates as (
    select
      a.id,
      a.full_name,
      a.email,
      a.referral_code,
      a.status,
      a.account_tier,
      a.created_at
    from public.affiliate_accounts a
    where a.status in ('active', 'suspended')
  ),
  filtered_events as (
    select
      e.affiliate_id,
      e.event_type,
      e.page_type,
      e.visitor_hash,
      e.created_at
    from public.affiliate_traffic_events e
    inner join filtered_affiliates a on a.id = e.affiliate_id
    where (p_from is null or e.event_date >= p_from)
      and (p_to is null or e.event_date <= p_to)
  )
  select
    jsonb_build_object(
      'views', coalesce(sum(case when event_type = 'view' then 1 else 0 end), 0)::integer,
      'clicks', coalesce(sum(case when event_type = 'click' then 1 else 0 end), 0)::integer,
      'storefront_views', coalesce(sum(case when event_type = 'view' and page_type = 'storefront' then 1 else 0 end), 0)::integer,
      'template_views', coalesce(sum(case when event_type = 'view' and page_type = 'template' then 1 else 0 end), 0)::integer,
      'unique_viewers', count(distinct case when event_type = 'view' then visitor_hash else null end)::integer,
      'unique_clickers', count(distinct case when event_type = 'click' then visitor_hash else null end)::integer,
      'total_affiliates', (select count(*)::integer from filtered_affiliates),
      'affiliates_with_traffic', (
        select count(distinct affiliate_id)::integer from filtered_events
      )
    )
  into v_totals
  from filtered_events;

  with filtered_affiliates as (
    select
      a.id,
      a.full_name,
      a.email,
      a.referral_code,
      a.status,
      a.account_tier,
      a.created_at
    from public.affiliate_accounts a
    where a.status in ('active', 'suspended')
  ),
  filtered_events as (
    select
      e.affiliate_id,
      e.event_type,
      e.page_type,
      e.visitor_hash,
      e.created_at
    from public.affiliate_traffic_events e
    inner join filtered_affiliates a on a.id = e.affiliate_id
    where (p_from is null or e.event_date >= p_from)
      and (p_to is null or e.event_date <= p_to)
  ),
  per_affiliate as (
    select
      a.id,
      a.full_name,
      a.email,
      a.referral_code,
      a.status,
      a.account_tier,
      a.created_at,
      coalesce(sum(case when e.event_type = 'view' then 1 else 0 end), 0)::integer as views,
      coalesce(sum(case when e.event_type = 'click' then 1 else 0 end), 0)::integer as clicks,
      coalesce(sum(case when e.event_type = 'view' and e.page_type = 'storefront' then 1 else 0 end), 0)::integer as storefront_views,
      coalesce(sum(case when e.event_type = 'view' and e.page_type = 'template' then 1 else 0 end), 0)::integer as template_views,
      count(distinct case when e.event_type = 'view' then e.visitor_hash else null end)::integer as unique_viewers,
      count(distinct case when e.event_type = 'click' then e.visitor_hash else null end)::integer as unique_clickers,
      max(e.created_at) as last_event_at
    from filtered_affiliates a
    left join filtered_events e on e.affiliate_id = a.id
    group by a.id, a.full_name, a.email, a.referral_code, a.status, a.account_tier, a.created_at
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'referral_code', p.referral_code,
        'status', p.status,
        'account_tier', coalesce(p.account_tier, 'basic'),
        'created_at', p.created_at,
        'views', p.views,
        'clicks', p.clicks,
        'storefront_views', p.storefront_views,
        'template_views', p.template_views,
        'unique_viewers', p.unique_viewers,
        'unique_clickers', p.unique_clickers,
        'last_event_at', p.last_event_at
      )
      order by p.views desc, p.clicks desc, lower(coalesce(p.full_name, '')) asc
    ),
    '[]'::jsonb
  )
  into v_affiliates
  from per_affiliate p;

  return jsonb_build_object(
    'available_years', v_years,
    'totals', v_totals,
    'affiliates', v_affiliates
  );
end;
$$;

revoke all on function public.get_admin_affiliate_traffic(date, date) from public, anon, authenticated;
grant execute on function public.get_admin_affiliate_traffic(date, date) to service_role;

notify pgrst, 'reload schema';
