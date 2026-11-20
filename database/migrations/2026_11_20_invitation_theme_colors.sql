alter table public.invitations
  add column if not exists theme_colors jsonb;

comment on column public.invitations.theme_colors is 'Kustomisasi palet warna tema undangan (bg, surface, ink, accent, ornament, photo_border).';
