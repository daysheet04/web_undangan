-- Per-product affiliate controls. A package is treated as a sellable product.
alter table public.template_packages
  add column if not exists affiliate_commission_default_percent numeric(5,2) not null default 0
    check (affiliate_commission_default_percent between 0 and 100),
  add column if not exists affiliate_commission_max_percent numeric(5,2) not null default 50
    check (affiliate_commission_max_percent between 0 and 100);

-- Keep the migration safe when an earlier version has already been applied.
alter table public.template_packages
  alter column affiliate_commission_default_percent set default 0,
  alter column affiliate_commission_max_percent set default 50;

update public.template_packages
set affiliate_commission_default_percent = 0,
    affiliate_commission_max_percent = 50;

create table if not exists public.affiliate_product_settings (
  affiliate_id uuid not null references public.affiliate_accounts(id) on delete cascade,
  package_id bigint not null references public.template_packages(id) on delete cascade,
  commission_percent numeric(5,2) not null default 0 check (commission_percent between 0 and 100),
  is_visible boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (affiliate_id, package_id)
);

alter table public.affiliate_product_settings
  alter column commission_percent set default 0,
  alter column is_visible set default false;

alter table public.orders
  add column if not exists affiliate_id uuid references public.affiliate_accounts(id) on delete set null,
  add column if not exists affiliate_commission_percent numeric(5,2),
  add column if not exists affiliate_commission_amount numeric(12,2) not null default 0;

create index if not exists idx_affiliate_product_settings_affiliate on public.affiliate_product_settings(affiliate_id, is_visible);
create index if not exists idx_orders_affiliate on public.orders(affiliate_id, created_at desc);

create or replace function public.create_daymoment_affiliate_order(
  p_order_code varchar,
  p_template_id bigint,
  p_package_id bigint,
  p_customer_name varchar,
  p_customer_phone varchar,
  p_customer_email varchar,
  p_editor_token varchar,
  p_amount numeric,
  p_affiliate_id uuid,
  p_referral_name varchar,
  p_commission_percent numeric,
  p_commission_amount numeric
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare new_order_id bigint;
begin
  insert into public.orders (
    order_code, template_id, package_id, customer_name, customer_phone,
    customer_email, editor_token, affiliate_id, referral_name, referral_amount,
    affiliate_commission_percent, affiliate_commission_amount
  ) values (
    p_order_code, p_template_id, p_package_id, p_customer_name, p_customer_phone,
    p_customer_email, p_editor_token, p_affiliate_id, p_referral_name, p_commission_amount,
    p_commission_percent, p_commission_amount
  ) returning id into new_order_id;
  insert into public.invitations (order_id) values (new_order_id);
  insert into public.payments (order_id, amount) values (new_order_id, p_amount);
  return new_order_id;
end;
$$;

alter table public.affiliate_product_settings enable row level security;
revoke all on public.affiliate_product_settings from public, anon, authenticated;
grant select, insert, update, delete on public.affiliate_product_settings to service_role;
revoke all on function public.create_daymoment_affiliate_order(varchar,bigint,bigint,varchar,varchar,varchar,varchar,numeric,uuid,varchar,numeric,numeric) from public, anon, authenticated;
grant execute on function public.create_daymoment_affiliate_order(varchar,bigint,bigint,varchar,varchar,varchar,varchar,numeric,uuid,varchar,numeric,numeric) to service_role;

notify pgrst, 'reload schema';
