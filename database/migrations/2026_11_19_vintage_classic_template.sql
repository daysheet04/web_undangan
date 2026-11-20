insert into templates (code,name,category,description,thumbnail,is_active)
values ('vintage_classic','Vintage Classic','Vintage Editorial','Undangan vintage klasik bernuansa kertas gading hangat dengan bingkai arch heirloom, ornamen ukiran tinta botani, segel lilin, dan animasi transisi yang lembut.','/assets/images/templates/vintage-classic/demo-cover.webp',true)
on conflict (code) do update set name=excluded.name, category=excluded.category, description=excluded.description, thumbnail=excluded.thumbnail, is_active=true;

insert into template_packages (template_id,code,name,tagline,price,gallery_limit,has_music,has_gift,has_wishes,sort_order,is_active)
select t.id,p.code,p.name,p.tagline,p.price,p.gallery_limit,p.has_music,p.has_gift,p.has_wishes,p.sort_order,true
from templates t cross join (values
 ('essential','Essential','Undangan klasik elegan yang cantik dan ringkas.',58000,2,false,false,false,1),
 ('signature','Signature','Lebih hidup dengan musik latar dan kartu RSVP ucapan.',95000,3,true,false,true,2),
 ('prestige','Prestige','Pengalaman vintage editorial lengkap dengan amplop digital.',99000,5,true,true,true,3)
) as p(code,name,tagline,price,gallery_limit,has_music,has_gift,has_wishes,sort_order)
where t.code='vintage_classic'
on conflict (template_id,code) do update set name=excluded.name,tagline=excluded.tagline,price=excluded.price,gallery_limit=excluded.gallery_limit,has_music=excluded.has_music,has_gift=excluded.has_gift,has_wishes=excluded.has_wishes,sort_order=excluded.sort_order,is_active=true;
