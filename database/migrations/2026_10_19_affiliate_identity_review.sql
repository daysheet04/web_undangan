-- Affiliate identity review. KTP files are stored privately in R2; only the
-- opaque object key is stored in PostgreSQL.
alter table public.affiliate_accounts
  add column if not exists nik varchar(16),
  add column if not exists ktp_object_key text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note varchar(500);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'affiliate_accounts_nik_format'
  ) then
    alter table public.affiliate_accounts
      add constraint affiliate_accounts_nik_format
      check (nik is null or nik ~ '^[0-9]{16}$');
  end if;
end $$;

create unique index if not exists affiliate_accounts_nik_unique
  on public.affiliate_accounts(nik)
  where nik is not null;

drop function if exists public.register_affiliate_account(text,text,text,text,text,timestamptz);

create function public.register_affiliate_account(
  p_full_name text,
  p_phone text,
  p_email text,
  p_password text,
  p_nik text,
  p_ktp_object_key text,
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

  base_code := upper(regexp_replace(coalesce(p_full_name, 'PARTNER'), '[^a-zA-Z0-9]', '', 'g'));
  base_code := left(coalesce(nullif(base_code, ''), 'PARTNER'), 10);
  final_code := base_code || upper(substr(replace(new_id::text, '-', ''), 1, 7));

  insert into public.affiliate_accounts (
    id, email, password_hash, full_name, phone, referral_code, nik, ktp_object_key, status
  ) values (
    new_id,
    normalized_email,
    crypt(p_password, gen_salt('bf', 12)),
    left(trim(p_full_name), 120),
    left(trim(p_phone), 24),
    final_code,
    p_nik,
    p_ktp_object_key,
    'pending'
  );

  insert into public.affiliate_email_verifications (
    affiliate_id, token_hash, expires_at
  ) values (
    new_id, p_verification_token_hash, p_verification_expires_at
  );

  return query
  select account.id, account.email, account.full_name, account.status
  from public.affiliate_accounts account
  where account.id = new_id;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'affiliate_email_or_nik_exists';
end;
$$;

drop function if exists public.verify_affiliate_password(text,text);

create function public.verify_affiliate_password(p_email text, p_password text)
returns table(id uuid, email varchar, full_name varchar, phone varchar, referral_code varchar, status varchar, email_verified_at timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select account.id, account.email, account.full_name, account.phone, account.referral_code, account.status, account.email_verified_at
  from public.affiliate_accounts account
  where account.email = lower(trim(p_email))
    and account.password_hash = crypt(p_password, account.password_hash)
  limit 1;
$$;

create or replace function public.activate_affiliate_account(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_affiliate_id uuid;
  verified_rows integer;
begin
  select verification.affiliate_id
    into target_affiliate_id
  from public.affiliate_email_verifications verification
  where verification.token_hash = p_token_hash
    and verification.used_at is null
    and verification.expires_at > timezone('utc', now())
  for update;

  if target_affiliate_id is null then return false; end if;

  update public.affiliate_email_verifications
  set used_at = timezone('utc', now())
  where token_hash = p_token_hash;

  update public.affiliate_accounts
  set email_verified_at = coalesce(email_verified_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where id = target_affiliate_id and status = 'pending';

  get diagnostics verified_rows = row_count;
  return verified_rows = 1;
end;
$$;

revoke all on function public.register_affiliate_account(text,text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.verify_affiliate_password(text,text) from public, anon, authenticated;
grant execute on function public.register_affiliate_account(text,text,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.verify_affiliate_password(text,text) to service_role;
