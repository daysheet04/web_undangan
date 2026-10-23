-- Migration: Configurable minimum withdrawal for affiliate partners
-- Date: 2026-10-23

alter table public.affiliate_withdrawal_settings
  add column if not exists min_withdrawal_amount numeric(12,2) not null default 50000
  check (min_withdrawal_amount >= 10000);

-- Update request_affiliate_withdrawal to dynamically enforce min_withdrawal_amount
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
  applied_min_withdrawal numeric(12,2);
  applied_fee_percent numeric(5,2);
  applied_fee_amount numeric(12,2);
  applied_net_amount numeric(12,2);
  applied_sender_bank_name varchar(80);
  applied_sender_account_name varchar(120);
  applied_sender_account_number varchar(80);
  new_withdrawal_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_affiliate_id::text));

  if not exists (
    select 1 from public.affiliate_accounts
    where id = p_affiliate_id and status = 'active'
  ) then
    raise exception using errcode = 'P0001', message = 'affiliate_not_active';
  end if;

  select coalesce(min_withdrawal_amount, 50000), coalesce(fee_percent, 0), sender_bank_name, sender_account_name, sender_account_number
  into applied_min_withdrawal, applied_fee_percent, applied_sender_bank_name, applied_sender_account_name, applied_sender_account_number
  from public.affiliate_withdrawal_settings
  where singleton = true;

  applied_min_withdrawal := coalesce(applied_min_withdrawal, 50000);

  if p_amount < applied_min_withdrawal then
    raise exception using errcode = 'P0001', message = 'withdrawal_minimum_not_met';
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

  applied_fee_percent := coalesce(applied_fee_percent, 0);
  applied_fee_amount := round(p_amount * applied_fee_percent / 100, 2);
  applied_net_amount := round(p_amount - applied_fee_amount, 2);

  insert into public.affiliate_withdrawals (
    affiliate_id, amount, payout_method, provider, account_name, account_number,
    fee_percent, fee_amount, net_amount,
    sender_bank_name, sender_account_name, sender_account_number
  ) values (
    p_affiliate_id, round(p_amount, 2), p_payout_method,
    left(trim(p_provider), 50), left(trim(p_account_name), 120), left(trim(p_account_number), 80),
    applied_fee_percent, applied_fee_amount, applied_net_amount,
    applied_sender_bank_name, applied_sender_account_name, applied_sender_account_number
  ) returning id into new_withdrawal_id;

  return new_withdrawal_id;
end;
$$;

revoke all on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) from public, anon, authenticated;
grant execute on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) to service_role;
