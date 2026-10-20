-- Social platforms available for Affiliate Pro verification are managed by admin.
create table if not exists public.affiliate_social_platforms (
  id uuid primary key default extensions.gen_random_uuid(),
  name varchar(40) not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists affiliate_social_platforms_name_unique
  on public.affiliate_social_platforms(lower(name));
create index if not exists idx_affiliate_social_platforms_active
  on public.affiliate_social_platforms(is_active, sort_order, name);

insert into public.affiliate_social_platforms (name, is_active, sort_order)
values
  ('Instagram', true, 10),
  ('Facebook', true, 20),
  ('TikTok', true, 30),
  ('YouTube', true, 40),
  ('X / Twitter', true, 50)
on conflict do nothing;

alter table public.affiliate_social_platforms enable row level security;
revoke all on public.affiliate_social_platforms from public, anon, authenticated;
grant select, insert, update, delete on public.affiliate_social_platforms to service_role;

notify pgrst, 'reload schema';
