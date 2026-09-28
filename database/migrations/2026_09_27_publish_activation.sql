alter table public.invitations
  alter column is_active set default false;

-- Draft tidak aktif dan belum memiliki masa kedaluwarsa.
update public.invitations i
set is_active = false,
    active_until = null,
    published_at = null
where i.published_at is null
   or not exists (
     select 1
     from public.orders o
     where o.id = i.order_id
       and o.status = 'published'
   );

-- Undangan lama yang sudah terbit dihitung ulang dari tanggal publish,
-- bukan dari tanggal pembayaran. Tanggal akhir berlaku sampai akhir hari WIB.
update public.invitations i
set active_until = (
  (
    ((i.published_at at time zone 'Asia/Jakarta')::date + interval '2 months' + interval '1 day')
    at time zone 'Asia/Jakarta'
  ) - interval '1 millisecond'
)
where i.published_at is not null
  and exists (
    select 1
    from public.orders o
    where o.id = i.order_id
      and o.status = 'published'
  );

-- PostgreSQL menyimpan daftar kolom SELECT * saat view pertama kali dibuat.
-- Buat ulang view supaya kolom aktivasi yang ditambahkan belakangan ikut tersedia.
drop view if exists public.invitation_details;
create view public.invitation_details as
select i.*, o.order_code, o.editor_token, o.status order_status, o.payment_status, o.template_id, o.package_id,
  t.code template_code, t.name template_name, t.category template_category,
  p.code package_code, p.name package_name, p.price package_price, p.gallery_limit, p.has_music, p.has_gift, p.has_wishes
from public.invitations i
join public.orders o on o.id = i.order_id
join public.templates t on t.id = o.template_id
join public.template_packages p on p.id = o.package_id;

revoke all on public.invitation_details from anon, authenticated;
grant select on public.invitation_details to service_role;

create or replace function public.is_published_invitation(p_invitation_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.invitations i
    join public.orders o on o.id = i.order_id
    where i.id = p_invitation_id
      and i.published_at is not null
      and i.is_active = true
      and i.active_until is not null
      and (i.active_until at time zone 'Asia/Jakarta')::date >= (now() at time zone 'Asia/Jakarta')::date
      and o.status = 'published'
  );
$$;

revoke all on function public.is_published_invitation(bigint) from public;
grant execute on function public.is_published_invitation(bigint) to anon, authenticated, service_role;
