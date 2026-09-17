-- Jalankan sekali untuk database Daymoment yang dibuat sebelum integrasi Midtrans Snap.
alter table public.payments add column if not exists gateway_order_id varchar(64);
alter table public.payments add column if not exists snap_token text;
alter table public.payments add column if not exists snap_redirect_url text;
alter table public.payments add column if not exists payment_type varchar(50);
alter table public.orders add column if not exists customer_email varchar(254);

create unique index if not exists payments_gateway_order_id_unique
  on public.payments(gateway_order_id)
  where gateway_order_id is not null;

drop view if exists public.order_details;
create view public.order_details as
select o.*, t.code template_code, t.name template_name, t.category template_category,
  p.code package_code, p.name package_name, p.price package_price, p.gallery_limit, p.has_music, p.has_gift, p.has_wishes,
  pay.status payment_record_status, pay.gateway, pay.transaction_id, pay.gateway_order_id
from public.orders o join public.templates t on t.id=o.template_id join public.template_packages p on p.id=o.package_id
left join public.payments pay on pay.order_id=o.id;

grant select on public.order_details to service_role;

drop function if exists public.create_daymoment_order(varchar,bigint,bigint,varchar,varchar,varchar,numeric);
drop function if exists public.create_daymoment_order(varchar,bigint,bigint,varchar,varchar,varchar,varchar,numeric);
create function public.create_daymoment_order(
  p_order_code varchar, p_template_id bigint, p_package_id bigint,
  p_customer_name varchar, p_customer_phone varchar, p_customer_email varchar, p_editor_token varchar, p_amount numeric
) returns bigint language plpgsql security definer set search_path = public as $$
declare new_order_id bigint;
begin
  insert into public.orders (order_code,template_id,package_id,customer_name,customer_phone,customer_email,editor_token)
  values (p_order_code,p_template_id,p_package_id,p_customer_name,p_customer_phone,p_customer_email,p_editor_token)
  returning id into new_order_id;
  insert into public.invitations (order_id) values (new_order_id);
  insert into public.payments (order_id,amount) values (new_order_id,p_amount);
  return new_order_id;
end;
$$;
revoke all on function public.create_daymoment_order(varchar,bigint,bigint,varchar,varchar,varchar,varchar,numeric) from public, anon, authenticated;
grant execute on function public.create_daymoment_order(varchar,bigint,bigint,varchar,varchar,varchar,varchar,numeric) to service_role;
