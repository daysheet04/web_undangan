-- Editable visual settings for the public Daymoment homepage.
create table if not exists public.site_settings (
  key varchar(80) primary key,
  value text,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.site_settings enable row level security;
revoke all on public.site_settings from public, anon, authenticated;
grant select, insert, update, delete on public.site_settings to service_role;

notify pgrst, 'reload schema';
