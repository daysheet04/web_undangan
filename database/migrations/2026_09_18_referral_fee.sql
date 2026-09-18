-- Add referral owner and fee fields used by the admin fee manager.
alter table public.orders
  add column if not exists referral_name varchar(120),
  add column if not exists referral_amount numeric(12,2) not null default 0;

notify pgrst, 'reload schema';
