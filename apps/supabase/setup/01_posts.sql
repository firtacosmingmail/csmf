-- posts
-- Depends on: 00_extensions_and_functions.sql
-- The FK on preview_image_block_id -> post_blocks(id) is added in
-- 02_post_blocks.sql, once that table exists (circular reference).

create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  pinned boolean not null default false,
  preview_image_url text,
  preview_image_alt text,
  preview_image_block_id uuid,
  published_at timestamptz,
  -- locale + translation_group_id (FLE i18n): a post's translations share a
  -- translation_group_id, one row per locale. Slugs only need to be unique
  -- within a locale, not globally.
  locale text not null default 'en' check (locale in ('en', 'ro')),
  translation_group_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);

create trigger posts_set_updated_at
  before update on posts
  for each row
  execute function set_updated_at();

-- Sets published_at automatically the first time a post transitions to (or
-- is created as) 'published', unless the caller already supplied a value.
create or replace function set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published'
    and new.published_at is null
    and (tg_op = 'INSERT' or old.status is distinct from 'published')
  then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger posts_set_published_at
  before insert or update on posts
  for each row
  execute function set_published_at();

alter table posts enable row level security;

-- Public reads published posts; admin (any authenticated session, per the
-- single-admin model) reads/writes everything, including drafts.
create policy "public read published posts"
  on posts for select
  to anon, authenticated
  using (status = 'published');

create policy "admin full access to posts"
  on posts for all
  to authenticated
  using (true)
  with check (true);
