-- Password update for an already authenticated Daymoment Affiliate session.
drop function if exists public.change_affiliate_password(uuid,text,text);

create or replace function public.change_affiliate_password(
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
    and status = 'active';

  get diagnostics updated_rows = row_count;
  return updated_rows = 1;
end;
$$;

revoke all on function public.change_affiliate_password(uuid,text) from public, anon, authenticated;
grant execute on function public.change_affiliate_password(uuid,text) to service_role;

notify pgrst, 'reload schema';
