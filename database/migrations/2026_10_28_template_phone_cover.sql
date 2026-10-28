-- Menambahkan kolom phone_cover pada tabel templates
-- Digunakan untuk gambar sampul khusus tampilan mockup layar HP di homepage

alter table public.templates
add column if not exists phone_cover varchar(255);

comment on column public.templates.phone_cover is 'Gambar sampul khusus tampilan layar mockup HP di beranda (rasio vertikal ~1:2).';
