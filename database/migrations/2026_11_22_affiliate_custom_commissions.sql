-- Per-affiliate custom commission rates per template + admin password reset RPC.

create table if not exists public.affiliate_template_commissions (
  affiliate_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  template_id bigint not null references public.templates(id) on delete cascade,
  commission_percent numeric(5,2) not null check (commission_percent between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (affiliate_id, template_id)
);

create index if not exists idx_affiliate_template_commissions_affiliate
  on public.affiliate_template_commissions(affiliate_id);

alter table public.affiliate_template_commissions enable row level security;
revoke all on public.affiliate_template_commissions from public, anon, authenticated;
grant select, insert, update, delete on public.affiliate_template_commissions to service_role;

create or replace function public.admin_set_affiliate_password(
  p_affiliate_id uuid,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  updated_rows integer;
begin
  update public.affiliate_accounts
  set password_hash = crypt(p_new_password, gen_salt('bf', 12)),
      updated_at = timezone('utc', now())
  where id = p_affiliate_id
    and status in ('active', 'suspended');

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then
    return false;
  end if;

  update public.affiliate_password_resets
  set used_at = timezone('utc', now())
  where affiliate_id = p_affiliate_id
    and used_at is null;

  update public.affiliate_sessions
  set revoked_at = timezone('utc', now())
  where affiliate_id = p_affiliate_id
    and revoked_at is null;

  return true;
end;
$$;

revoke all on function public.admin_set_affiliate_password(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_affiliate_password(uuid, text) to service_role;

notify pgrst, 'reload schema';
