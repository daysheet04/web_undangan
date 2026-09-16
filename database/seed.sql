insert into public.templates (code,name,category,description,thumbnail,is_active)
values ('puspa_jawi','Puspa Jawi','Javanese Botanical','Romansa Jawa kontemporer dengan lanskap gunung, gapura ukir, puspa watercolor, dan awan bergerak.','puspa-jawi',true)
on conflict (code) do update set name=excluded.name,category=excluded.category,description=excluded.description,thumbnail=excluded.thumbnail,is_active=excluded.is_active;

insert into public.template_packages (template_id,code,name,tagline,price,gallery_limit,has_music,has_gift,has_wishes,sort_order,is_active)
select t.id,v.code,v.name,v.tagline,v.price,v.gallery_limit,v.has_music,v.has_gift,v.has_wishes,v.sort_order,true
from public.templates t cross join (values
 ('essential','Essential','Undangan inti yang cantik dan ringkas.',99000::numeric,2::smallint,false,false,false,1::smallint),
 ('signature','Signature','Lebih hidup dengan musik dan ucapan tamu.',159000::numeric,3::smallint,true,false,true,2::smallint),
 ('prestige','Prestige','Pengalaman lengkap dengan seluruh fitur premium.',249000::numeric,5::smallint,true,true,true,3::smallint)
) v(code,name,tagline,price,gallery_limit,has_music,has_gift,has_wishes,sort_order)
where t.code='puspa_jawi'
on conflict (template_id,code) do update set name=excluded.name,tagline=excluded.tagline,price=excluded.price,
 gallery_limit=excluded.gallery_limit,has_music=excluded.has_music,has_gift=excluded.has_gift,has_wishes=excluded.has_wishes,
 sort_order=excluded.sort_order,is_active=excluded.is_active;
