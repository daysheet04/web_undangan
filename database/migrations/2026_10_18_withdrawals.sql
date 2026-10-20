-- Affiliate earnings are derived from paid referral orders. Withdrawals reserve
-- that balance until the request is rejected/cancelled or marked paid.
create table if not exists public.affiliate_withdrawals (
  id uuid primary key default extensions.gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payout_method varchar(20) not null check (payout_method in ('bank', 'e_wallet')),
  provider varchar(50) not null,
  account_name varchar(120) not null,
  account_number varchar(80) not null,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'rejected', 'cancelled')),
  admin_note varchar(500),
  requested_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_affiliate_withdrawals_account
  on public.affiliate_withdrawals(affiliate_id, requested_at desc);
create index if not exists idx_affiliate_withdrawals_status
  on public.affiliate_withdrawals(status, requested_at desc);

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

alter table public.affiliate_withdrawals enable row level security;
revoke all on public.affiliate_withdrawals from public, anon, authenticated;
grant select, insert, update on public.affiliate_withdrawals to service_role;
revoke all on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) from public, anon, authenticated;
grant execute on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) to service_role;

notify pgrst, 'reload schema';
