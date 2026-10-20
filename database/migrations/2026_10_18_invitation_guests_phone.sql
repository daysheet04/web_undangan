-- Add phone_number column to invitation_guests if not exists
alter table public.invitation_guests add column if not exists phone_number varchar(35);
