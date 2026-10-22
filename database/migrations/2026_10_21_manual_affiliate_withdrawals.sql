-- Manual affiliate withdrawals, configurable fee/sender account, and social
-- identity captured during affiliate registration. Legacy Pro data is kept as
-- historical data but is no longer required by the withdrawal function.

alter table public.affiliate_accounts
  add column if not exists social_platform varchar(40),
  add column if not exists social_handle varchar(120),
  add column if not exists social_follower_count integer,
  add column if not exists social_proof_object_key text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'affiliate_accounts_social_followers_check'
  ) then
    alter table public.affiliate_accounts
      add constraint affiliate_accounts_social_followers_check
      check (social_follower_count is null or social_follower_count >= 0);
  end if;
end $$;

create table if not exists public.affiliate_withdrawal_settings (
  singleton boolean primary key default true check (singleton),
  fee_percent numeric(5,2) not null default 5 check (fee_percent >= 0 and fee_percent <= 100),
  sender_bank_name varchar(80),
  sender_account_name varchar(120),
  sender_account_number varchar(80),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.affiliate_withdrawal_settings (singleton, fee_percent)
values (true, 5)
on conflict (singleton) do nothing;

alter table public.affiliate_withdrawals
  add column if not exists fee_percent numeric(5,2) not null default 0,
  add column if not exists fee_amount numeric(12,2) not null default 0,
  add column if not exists net_amount numeric(12,2),
  add column if not exists transfer_proof_object_key text,
  add column if not exists sender_bank_name varchar(80),
  add column if not exists sender_account_name varchar(120),
  add column if not exists sender_account_number varchar(80);

update public.affiliate_withdrawals
set net_amount = amount - coalesce(fee_amount, 0)
where net_amount is null;

alter table public.affiliate_withdrawals
  alter column net_amount set not null;

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

  select fee_percent, sender_bank_name, sender_account_name, sender_account_number
  into applied_fee_percent, applied_sender_bank_name, applied_sender_account_name, applied_sender_account_number
  from public.affiliate_withdrawal_settings
  where singleton = true;
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

create or replace function public.register_affiliate_account(
  p_full_name text,
  p_phone text,
  p_email text,
  p_password text,
  p_nik text,
  p_ktp_object_key text,
  p_social_platform text,
  p_social_handle text,
  p_social_follower_count integer,
  p_social_proof_object_key text,
  p_verification_token_hash text,
  p_verification_expires_at timestamptz
)
returns table(id uuid, email varchar, full_name varchar, status varchar)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid := gen_random_uuid();
  normalized_email text := lower(trim(p_email));
  base_code text;
  final_code text;
begin
  if p_nik is null or p_nik !~ '^[0-9]{16}$' then
    raise exception using errcode = '22023', message = 'affiliate_nik_invalid';
  end if;
  if nullif(trim(p_ktp_object_key), '') is null then
    raise exception using errcode = '22023', message = 'affiliate_ktp_required';
  end if;
  if nullif(trim(p_social_platform), '') is null or nullif(trim(p_social_handle), '') is null
     or p_social_follower_count is null or p_social_follower_count < 0
     or nullif(trim(p_social_proof_object_key), '') is null then
    raise exception using errcode = '22023', message = 'affiliate_social_required';
  end if;

  base_code := upper(regexp_replace(coalesce(p_full_name, 'PARTNER'), '[^a-zA-Z0-9]', '', 'g'));
  base_code := left(coalesce(nullif(base_code, ''), 'PARTNER'), 10);
  final_code := base_code || upper(substr(replace(new_id::text, '-', ''), 1, 7));

  insert into public.affiliate_accounts (
    id, email, password_hash, full_name, phone, referral_code, nik, ktp_object_key,
    social_platform, social_handle, social_follower_count, social_proof_object_key, status
  ) values (
    new_id, normalized_email, crypt(p_password, gen_salt('bf', 12)),
    left(trim(p_full_name), 120), left(trim(p_phone), 24), final_code, p_nik, p_ktp_object_key,
    left(trim(p_social_platform), 40), left(trim(p_social_handle), 120),
    p_social_follower_count, p_social_proof_object_key, 'pending'
  );

  insert into public.affiliate_email_verifications (affiliate_id, token_hash, expires_at)
  values (new_id, p_verification_token_hash, p_verification_expires_at);

  return query select account.id, account.email, account.full_name, account.status
  from public.affiliate_accounts account where account.id = new_id;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'affiliate_email_or_nik_exists';
end;
$$;

create or replace function public.resubmit_affiliate_registration(
  p_token_hash text,
  p_full_name text,
  p_phone text,
  p_nik text,
  p_ktp_object_key text default null,
  p_social_platform text default null,
  p_social_handle text default null,
  p_social_follower_count integer default null,
  p_social_proof_object_key text default null
)
returns table(id uuid, old_ktp_object_key text, old_social_proof_object_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_affiliate_id uuid;
  previous_ktp_object_key text;
  previous_social_proof_object_key text;
  updated_rows integer;
  submitted_at timestamptz := now();
begin
  if p_nik is null or p_nik !~ '^[0-9]{16}$' then
    raise exception using errcode = '22023', message = 'affiliate_nik_invalid';
  end if;

  select correction.affiliate_id into target_affiliate_id
  from public.affiliate_review_corrections correction
  where correction.token_hash = p_token_hash
    and correction.used_at is null and correction.expires_at > now()
  for update;
  if target_affiliate_id is null then return; end if;

  select account.ktp_object_key, account.social_proof_object_key
  into previous_ktp_object_key, previous_social_proof_object_key
  from public.affiliate_accounts account
  where account.id = target_affiliate_id and account.status = 'rejected'
  for update;
  if not found then return; end if;

  update public.affiliate_accounts
  set full_name = left(trim(p_full_name), 120),
      phone = left(trim(p_phone), 24),
      nik = p_nik,
      ktp_object_key = coalesce(nullif(trim(p_ktp_object_key), ''), ktp_object_key),
      social_platform = coalesce(nullif(trim(p_social_platform), ''), social_platform),
      social_handle = coalesce(nullif(trim(p_social_handle), ''), social_handle),
      social_follower_count = coalesce(p_social_follower_count, social_follower_count),
      social_proof_object_key = coalesce(nullif(trim(p_social_proof_object_key), ''), social_proof_object_key),
      status = 'pending', reviewed_at = null, review_note = null,
      resubmitted_at = submitted_at, updated_at = submitted_at
  where affiliate_accounts.id = target_affiliate_id and affiliate_accounts.status = 'rejected';

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then return; end if;

  insert into public.affiliate_review_history (affiliate_id, action, created_at)
  values (target_affiliate_id, 'resubmitted', submitted_at);
  update public.affiliate_review_corrections set used_at = submitted_at
  where affiliate_id = target_affiliate_id and used_at is null;

  return query select target_affiliate_id, previous_ktp_object_key, previous_social_proof_object_key;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'affiliate_nik_exists';
end;
$$;

alter table public.affiliate_withdrawal_settings enable row level security;
revoke all on public.affiliate_withdrawal_settings from public, anon, authenticated;
grant select, insert, update, delete on public.affiliate_withdrawal_settings to service_role;

revoke all on function public.register_affiliate_account(text,text,text,text,text,text,text,text,integer,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.register_affiliate_account(text,text,text,text,text,text,text,text,integer,text,text,timestamptz) to service_role;
revoke all on function public.resubmit_affiliate_registration(text,text,text,text,text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.resubmit_affiliate_registration(text,text,text,text,text,text,text,integer,text) to service_role;
revoke all on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) from public, anon, authenticated;
grant execute on function public.request_affiliate_withdrawal(uuid,numeric,varchar,varchar,varchar,varchar) to service_role;

notify pgrst, 'reload schema';
