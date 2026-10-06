insert into templates (code,name,category,description,thumbnail,is_active)
values ('verdant_vow','Verdant Vow','Sage Garden 4D','Perjalanan garden wedding emerald-sage dalam satu panggung sinematik, dengan pasangan, kabut, botanical aisle, dan parallax berlapis.','verdant-vow',true)
on conflict (code) do update set name=excluded.name, category=excluded.category, description=excluded.description, thumbnail=excluded.thumbnail, is_active=true;

insert into template_packages (template_id,code,name,tagline,price,gallery_limit,has_music,has_gift,has_wishes,sort_order,is_active)
select t.id,p.code,p.name,p.tagline,p.price,p.gallery_limit,p.has_music,p.has_gift,p.has_wishes,p.sort_order,true
from templates t cross join (values
('essential','Essential','Undangan garden 4D yang cantik dan ringan.',129000,2,false,false,false,1),
('signature','Signature','Garden story dengan musik dan ucapan tamu.',199000,3,true,false,true,2),
('prestige','Prestige','Pengalaman 4D lengkap dengan seluruh fitur premium.',299000,5,true,true,true,3)
) as p(code,name,tagline,price,gallery_limit,has_music,has_gift,has_wishes,sort_order)
where t.code='verdant_vow'
on conflict (template_id,code) do update set name=excluded.name,tagline=excluded.tagline,price=excluded.price,gallery_limit=excluded.gallery_limit,has_music=excluded.has_music,has_gift=excluded.has_gift,has_wishes=excluded.has_wishes,sort_order=excluded.sort_order,is_active=true;
