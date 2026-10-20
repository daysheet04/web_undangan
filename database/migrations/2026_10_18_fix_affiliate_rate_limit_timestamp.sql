-- Fix PostgreSQL keyword collision: CURRENT_TIME is a time with time zone,
-- while rate-limit columns use timestamp with time zone.
create or replace function public.consume_affiliate_rate_limit(
  p_action text,
  p_key_hash text,
  p_max_attempts integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket public.affiliate_rate_limits%rowtype;
  v_now timestamptz := now();
  retry_seconds integer;
begin
  if length(p_action) < 1 or length(p_action) > 64
    or length(p_key_hash) <> 64
    or p_max_attempts < 1
    or p_window_seconds < 1
    or p_block_seconds < 1 then
    raise exception 'invalid_rate_limit_parameters';
  end if;

  if random() < 0.01 then
    delete from public.affiliate_rate_limits
    where updated_at < v_now - interval '7 days';
  end if;

  insert into public.affiliate_rate_limits(action, key_hash, attempt_count)
  values (left(p_action, 64), p_key_hash, 0)
  on conflict (action, key_hash) do nothing;

  select limits.* into bucket
  from public.affiliate_rate_limits limits
  where limits.action = left(p_action, 64)
    and limits.key_hash = p_key_hash
  for update;

  if bucket.blocked_until is not null and bucket.blocked_until > v_now then
    retry_seconds := greatest(1, ceil(extract(epoch from bucket.blocked_until - v_now))::integer);
    update public.affiliate_rate_limits
    set updated_at = v_now
    where action = bucket.action and key_hash = bucket.key_hash;
    return query select false, retry_seconds;
    return;
  end if;

  if bucket.window_started_at <= v_now - make_interval(secs => p_window_seconds) then
    update public.affiliate_rate_limits
    set window_started_at = v_now,
        attempt_count = 1,
        blocked_until = null,
        updated_at = v_now
    where action = bucket.action and key_hash = bucket.key_hash;
    return query select true, 0;
    return;
  end if;

  if bucket.attempt_count >= p_max_attempts then
    update public.affiliate_rate_limits
    set attempt_count = attempt_count + 1,
        blocked_until = v_now + make_interval(secs => p_block_seconds),
        updated_at = v_now
    where action = bucket.action and key_hash = bucket.key_hash;
    return query select false, p_block_seconds;
    return;
  end if;

  update public.affiliate_rate_limits
  set attempt_count = attempt_count + 1,
      blocked_until = null,
      updated_at = v_now
  where action = bucket.action and key_hash = bucket.key_hash;
  return query select true, 0;
end;
$$;

revoke all on function public.consume_affiliate_rate_limit(text,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_affiliate_rate_limit(text,text,integer,integer,integer) to service_role;

notify pgrst, 'reload schema';
