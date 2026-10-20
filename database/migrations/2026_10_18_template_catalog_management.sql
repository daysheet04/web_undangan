-- Menjadikan thumbnail sebagai gambar sampul katalog yang dapat diganti admin.
-- Update hanya nilai lama/bawaan supaya cover yang pernah diubah tidak tertimpa.
update public.templates
set thumbnail = case code
  when 'puspa_jawi' then '/assets/images/templates/puspa-jawi/puspa-cover-washi-v2.webp'
  when 'lunara_azure' then '/assets/images/templates/lunara-azure/lunara-opening-aurora-contour-v1.webp'
  when 'aurelia_grande' then '/assets/images/templates/aurelia-grande/grand-ballroom-stage.webp'
  when 'verdant_vow' then '/assets/images/templates/verdant-vow/cinematic/scene-01-grand-gate-v1.webp'
  else thumbnail
end
where thumbnail is null
   or thumbnail in ('puspa-jawi', 'lunara-azure', 'aurelia-grande', 'verdant-vow');
