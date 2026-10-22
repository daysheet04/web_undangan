alter table public.invitations
  add column if not exists nearest_landmark varchar(240),
  add column if not exists route_directions text,
  add column if not exists transportation_guide text;

comment on column public.invitations.nearest_landmark is 'Patokan terdekat menuju lokasi acara.';
comment on column public.invitations.route_directions is 'Petunjuk arah singkat dari patokan menuju lokasi acara.';
comment on column public.invitations.transportation_guide is 'Saran kendaraan umum, transportasi online, atau akses kendaraan pribadi.';
