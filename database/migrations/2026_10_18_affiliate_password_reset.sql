-- One-time password reset tokens for the custom Daymoment Affiliate auth flow.
create table if not exists public.affiliate_password_resets (
  id uuid primary key default extensions.gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  token_hash char(64) not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_affiliate_password_resets_account
  on public.affiliate_password_resets(affiliate_id, created_at desc);
create index if not exists idx_affiliate_password_resets_active
  on public.affiliate_password_resets(token_hash, expires_at)
  where used_at is null;

create or replace function public.reset_affiliate_password(
  p_token_hash text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target_affiliate_id uuid;
begin
  select password_reset.affiliate_id
    into target_affiliate_id
  from public.affiliate_password_resets password_reset
  join public.affiliate_accounts account on account.id = password_reset.affiliate_id
  where password_reset.token_hash = p_token_hash
    and password_reset.used_at is null
    and password_reset.expires_at > timezone('utc', now())
    and account.status = 'active'
  for update of password_reset;

  if target_affiliate_id is null then return false; end if;

  update public.affiliate_password_resets
  set used_at = timezone('utc', now())
  where affiliate_id = target_affiliate_id
    and used_at is null;

  update public.affiliate_accounts
  set password_hash = crypt(p_new_password, gen_salt('bf', 12)),
      updated_at = timezone('utc', now())
  where id = target_affiliate_id;

  update public.affiliate_sessions
  set revoked_at = timezone('utc', now())
  where affiliate_id = target_affiliate_id
    and revoked_at is null;

  return true;
end;
$$;

alter table public.affiliate_password_resets enable row level security;
revoke all on public.affiliate_password_resets from public, anon, authenticated;
revoke all on function public.reset_affiliate_password(text,text) from public, anon, authenticated;
grant select, insert, update, delete on public.affiliate_password_resets to service_role;
grant execute on function public.reset_affiliate_password(text,text) to service_role;

notify pgrst, 'reload schema';
