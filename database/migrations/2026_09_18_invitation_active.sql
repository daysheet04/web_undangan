alter table public.invitations
  add column if not exists is_active boolean not null default true;

alter table public.invitations
  add column if not exists active_until timestamptz;

alter table public.orders
  add column if not exists referral_name varchar(120);

alter table public.orders
  add column if not exists referral_amount numeric(12,2) not null default 0;

create index if not exists idx_invitations_active on public.invitations(is_active);
create index if not exists idx_invitations_active_until on public.invitations(active_until);

update public.invitations i
set active_until = p.paid_at + interval '2 months'
from public.orders o
join public.payments p on p.order_id = o.id
where i.order_id = o.id
  and o.payment_status = 'paid'
  and p.paid_at is not null;

drop view if exists public.invitation_details;
drop view if exists public.order_details;
create view public.order_details as
select o.*, t.code template_code, t.name template_name, t.category template_category,
  p.code package_code, p.name package_name, p.price package_price, p.gallery_limit, p.has_music, p.has_gift, p.has_wishes,
  pay.status payment_record_status, pay.gateway, pay.transaction_id, pay.gateway_order_id
from public.orders o join public.templates t on t.id=o.template_id join public.template_packages p on p.id=o.package_id
left join public.payments pay on pay.order_id=o.id;

create view public.invitation_details as
select i.*, o.order_code, o.editor_token, o.status order_status, o.payment_status, o.template_id, o.package_id,
  t.code template_code, t.name template_name, t.category template_category,
  p.code package_code, p.name package_name, p.price package_price, p.gallery_limit, p.has_music, p.has_gift, p.has_wishes
from public.invitations i join public.orders o on o.id=i.order_id join public.templates t on t.id=o.template_id
join public.template_packages p on p.id=o.package_id;

grant select on public.invitation_details to service_role;
grant select on public.order_details to service_role;