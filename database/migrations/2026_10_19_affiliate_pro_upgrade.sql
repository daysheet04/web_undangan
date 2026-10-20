-- Affiliate Pro is required before an affiliate can request a withdrawal.
-- Pro can be granted after admin approval of social-media proof or after a
-- successful one-time Midtrans payment of Rp20.000.
alter table public.affiliate_accounts
  add column if not exists account_tier varchar(20) not null default 'basic',
  add column if not exists pro_activated_at timestamptz,
  add column if not exists pro_source varchar(20);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'affiliate_accounts_tier_check'
  ) then
    alter table public.affiliate_accounts
      add constraint affiliate_accounts_tier_check
      check (account_tier in ('basic', 'pro'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'affiliate_accounts_pro_source_check'
  ) then
    alter table public.affiliate_accounts
      add constraint affiliate_accounts_pro_source_check
      check (pro_source is null or pro_source in ('social', 'payment', 'admin'));
  end if;
end $$;

create table if not exists public.affiliate_pro_upgrade_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  method varchar(20) not null check (method in ('social', 'payment')),
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'paid', 'failed', 'expired', 'cancelled')),
  social_platform varchar(40),
  social_handle varchar(120),
  follower_count integer check (follower_count is null or follower_count >= 0),
  proof_object_key varchar(500),
  payment_amount numeric(12,2),
  gateway_order_id varchar(80) unique,
  snap_token varchar(255),
  snap_redirect_url text,
  transaction_id varchar(120),
  review_note varchar(500),
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_affiliate_pro_upgrade_account
  on public.affiliate_pro_upgrade_requests(affiliate_id, created_at desc);
create index if not exists idx_affiliate_pro_upgrade_review
  on public.affiliate_pro_upgrade_requests(status, method, created_at desc);
drop index if exists public.affiliate_pro_upgrade_pending_social_unique;
create unique index if not exists affiliate_pro_upgrade_pending_unique
  on public.affiliate_pro_upgrade_requests(affiliate_id)
  where status = 'pending';

create or replace function public.complete_affiliate_pro_payment(
  p_gateway_order_id varchar,
  p_transaction_id varchar default null,
  p_paid_at timestamptz default timezone('utc', now())
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_affiliate_id uuid;
begin
  update public.affiliate_pro_upgrade_requests
  set status = 'paid',
      transaction_id = nullif(left(trim(coalesce(p_transaction_id, '')), 120), ''),
      paid_at = coalesce(p_paid_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where gateway_order_id = p_gateway_order_id
    and method = 'payment'
    and status in ('pending', 'paid')
  returning affiliate_id into target_affiliate_id;

  if target_affiliate_id is null then
    return null;
  end if;

  update public.affiliate_accounts
  set account_tier = 'pro',
      pro_source = 'payment',
      pro_activated_at = coalesce(pro_activated_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where id = target_affiliate_id;

  -- A paid upgrade supersedes any social-media review that is still waiting.
  update public.affiliate_pro_upgrade_requests
  set status = 'cancelled',
      review_note = 'Akun telah upgrade melalui pembayaran.',
      reviewed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where affiliate_id = target_affiliate_id
    and method = 'social'
    and status = 'pending';

  return target_affiliate_id;
end;
$$;

create or replace function public.request_affiliate_withdrawal(
  p_affiliate_id uuid,
  p_amount numeric,
  p_payout_method varchar,
  p_provider varchar,
  p_account_name varchar,
  p_account_number varchar
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  earned_amount numeric(12,2);
  reserved_amount numeric(12,2);
  available_amount numeric(12,2);
  new_withdrawal_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_affiliate_id::text));

  if not exists (
    select 1 from public.affiliate_accounts
    where id = p_affiliate_id and status = 'active'
  ) then
    raise exception using errcode = 'P0001', message = 'affiliate_not_active';
  end if;

  if not exists (
    select 1 from public.affiliate_accounts
    where id = p_affiliate_id and account_tier = 'pro'
  ) then
    raise exception using errcode = 'P0001', message = 'affiliate_pro_required';
  end if;

  if p_amount < 50000 then
    raise exception using errcode = 'P0001', message = 'withdrawal_minimum_50000';
  end if;

  select coalesce(sum(affiliate_commission_amount), 0)
  into earned_amount
  from public.orders
  where affiliate_id = p_affiliate_id and payment_status = 'paid';

  select coalesce(sum(amount), 0)
  into reserved_amount
  from public.affiliate_withdrawals
  where affiliate_id = p_affiliate_id
    and status in ('pending', 'processing', 'paid');

  available_amount := earned_amount - reserved_amount;
  if p_amount > available_amount then
    raise exception using errcode = 'P0001', message = 'insufficient_affiliate_balance';
  end if;

  insert into public.affiliate_withdrawals (
    affiliate_id, amount, payout_method, provider, account_name, account_number
  ) values (
    p_affiliate_id, round(p_amount, 2), p_payout_method,
    left(trim(p_provider), 50), left(trim(p_account_name), 120), left(trim(p_account_number), 80)
  ) returning id into new_withdrawal_id;

  return new_withdrawal_id;
end;
$$;

alter table public.affiliate_pro_upgrade_requests enable row level security;
revoke all on public.affiliate_pro_upgrade_requests from public, anon, authenticated;
grant select, insert, update, delete on public.affiliate_pro_upgrade_requests to service_role;
revoke all on function public.complete_affiliate_pro_payment(varchar,varchar,timestamptz) from public, anon, authenticated;
grant execute on function public.complete_affiliate_pro_payment(varchar,varchar,timestamptz) to service_role;
revoke all on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) from public, anon, authenticated;
grant execute on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) to service_role;

notify pgrst, 'reload schema';
