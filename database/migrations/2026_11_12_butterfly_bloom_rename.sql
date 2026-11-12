-- Rename Butterfly Blum template display name to Butterfly Bloom
update public.templates
set name = 'Butterfly Bloom'
where code = 'lunara_azure'
   or lower(name) = 'butterfly blum';

