-- Migration: Reusable Inactive Slugs with Conflict Prevention
-- Date: 2026-10-23
-- Allows inactive and draft invitations to reuse slug names,
-- while strictly enforcing that only one ACTIVE & PUBLISHED invitation can have that slug.

-- 1. Drop existing global unique constraint on invitations.slug if present
alter table public.invitations drop constraint if exists invitations_slug_key;
drop index if exists public.invitations_slug_key;
drop index if exists public.idx_invitations_active_slug;

-- 2. Create partial unique index: slug is only unique for invitations that are active, published, and not null
create unique index idx_invitations_active_slug
on public.invitations(slug)
where (is_active = true and published_at is not null and slug is not null);
