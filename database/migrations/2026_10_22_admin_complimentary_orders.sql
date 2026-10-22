alter table public.orders
  add column if not exists order_source varchar(24) not null default 'customer',
  add column if not exists complimentary_note varchar(500);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_order_source_check'
  ) then
    alter table public.orders
      add constraint orders_order_source_check check (order_source in ('customer', 'admin_free'));
  end if;
end $$;

create index if not exists idx_orders_source_created
  on public.orders(order_source, created_at desc);

create or replace function public.create_daymoment_admin_free_order(
  p_order_code varchar,
  p_template_id bigint,
  p_package_id bigint,
  p_customer_name varchar,
  p_customer_phone varchar,
  p_customer_email varchar,
  p_editor_token varchar,
  p_complimentary_note varchar
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare new_order_id bigint;
begin
  insert into public.orders (
    order_code, template_id, package_id, customer_name, customer_phone, customer_email,
    editor_token, status, payment_status, order_source, complimentary_note
  ) values (
    p_order_code, p_template_id, p_package_id, p_customer_name, p_customer_phone, p_customer_email,
    p_editor_token, 'editing', 'paid', 'admin_free', nullif(trim(p_complimentary_note), '')
  ) returning id into new_order_id;

  insert into public.invitations (order_id, is_active, active_until)
  values (new_order_id, false, null);

  insert into public.payments (
    order_id, gateway, transaction_id, amount, status, paid_at
  ) values (
    new_order_id, 'admin_complimentary', concat('FREE-', p_order_code), 0, 'paid', timezone('utc', now())
  );

  return new_order_id;
end;
$$;

revoke all on function public.create_daymoment_admin_free_order(varchar,bigint,bigint,varchar,varchar,varchar,varchar,varchar)
  from public, anon, authenticated;
grant execute on function public.create_daymoment_admin_free_order(varchar,bigint,bigint,varchar,varchar,varchar,varchar,varchar)
  to service_role;

notify pgrst, 'reload schema';
