-- posts
-- Depends on: 00_extensions_and_functions.sql
-- The FK on preview_image_block_id -> post_blocks(id) is added in
-- 02_post_blocks.sql, once that table exists (circular reference).

create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  pinned boolean not null default false,
  preview_image_url text,
  preview_image_alt text,
  preview_image_block_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger posts_set_updated_at
  before update on posts
  for each row
  execute function set_updated_at();

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
