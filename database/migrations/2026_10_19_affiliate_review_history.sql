-- Permanent review audit trail. Unlike the current account status, these
-- entries are never cleared when an affiliate resubmits identity data.
create table if not exists public.affiliate_review_history (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  action varchar(20) not null check (action in ('rejected', 'resubmitted', 'approved')),
  note varchar(500),
  created_at timestamptz not null default now()
);

create index if not exists affiliate_review_history_affiliate_idx
  on public.affiliate_review_history(affiliate_id, created_at asc);

alter table public.affiliate_review_history enable row level security;
revoke all on table public.affiliate_review_history from public, anon, authenticated;
grant select, insert, update, delete on table public.affiliate_review_history to service_role;

-- Preserve review information that still exists before this migration.
insert into public.affiliate_review_history (affiliate_id, action, note, created_at)
select account.id, 'rejected', account.review_note, account.reviewed_at
from public.affiliate_accounts account
where account.status = 'rejected'
  and account.reviewed_at is not null
  and not exists (
    select 1 from public.affiliate_review_history history
    where history.affiliate_id = account.id and history.action = 'rejected'
  );

insert into public.affiliate_review_history (affiliate_id, action, note, created_at)
select account.id, 'approved', account.review_note, account.reviewed_at
from public.affiliate_accounts account
where account.status = 'active'
  and account.reviewed_at is not null
  and not exists (
    select 1 from public.affiliate_review_history history
    where history.affiliate_id = account.id and history.action = 'approved'
  );

-- A resubmission clears reviewed_at/review_note. Recover its rejection time
-- from the first correction link created for that registration.
insert into public.affiliate_review_history (affiliate_id, action, created_at)
select account.id, 'rejected', min(correction.created_at)
from public.affiliate_accounts account
join public.affiliate_review_corrections correction on correction.affiliate_id = account.id
where account.resubmitted_at is not null
  and not exists (
    select 1 from public.affiliate_review_history history
    where history.affiliate_id = account.id and history.action = 'rejected'
  )
group by account.id;

insert into public.affiliate_review_history (affiliate_id, action, created_at)
select account.id, 'resubmitted', account.resubmitted_at
from public.affiliate_accounts account
where account.resubmitted_at is not null
  and not exists (
    select 1 from public.affiliate_review_history history
    where history.affiliate_id = account.id and history.action = 'resubmitted'
  );

create or replace function public.resubmit_affiliate_registration(
  p_token_hash text,
  p_full_name text,
  p_phone text,
  p_nik text,
  p_ktp_object_key text default null
)
returns table(id uuid, old_ktp_object_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_affiliate_id uuid;
  previous_ktp_object_key text;
  updated_rows integer;
  submitted_at timestamptz := now();
begin
  if p_nik is null or p_nik !~ '^[0-9]{16}$' then
    raise exception using errcode = '22023', message = 'affiliate_nik_invalid';
  end if;

  select correction.affiliate_id
    into target_affiliate_id
  from public.affiliate_review_corrections correction
  where correction.token_hash = p_token_hash
    and correction.used_at is null
    and correction.expires_at > now()
  for update;

  if target_affiliate_id is null then return; end if;

  select account.ktp_object_key
    into previous_ktp_object_key
  from public.affiliate_accounts account
  where account.id = target_affiliate_id and account.status = 'rejected'
  for update;

  if not found then return; end if;

  update public.affiliate_accounts
  set full_name = left(trim(p_full_name), 120),
      phone = left(trim(p_phone), 24),
      nik = p_nik,
      ktp_object_key = coalesce(nullif(trim(p_ktp_object_key), ''), ktp_object_key),
      status = 'pending',
      reviewed_at = null,
      review_note = null,
      resubmitted_at = submitted_at,
      updated_at = submitted_at
  where affiliate_accounts.id = target_affiliate_id
    and affiliate_accounts.status = 'rejected';

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then return; end if;

  insert into public.affiliate_review_history (affiliate_id, action, created_at)
  values (target_affiliate_id, 'resubmitted', submitted_at);

  update public.affiliate_review_corrections
  set used_at = submitted_at
  where affiliate_id = target_affiliate_id and used_at is null;

  return query select target_affiliate_id, previous_ktp_object_key;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'affiliate_nik_exists';
end;
$$;

revoke all on function public.resubmit_affiliate_registration(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.resubmit_affiliate_registration(text,text,text,text,text) to service_role;
