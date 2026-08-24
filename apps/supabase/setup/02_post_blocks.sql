-- post_blocks
-- Depends on: 00_extensions_and_functions.sql, 01_posts.sql

create table post_blocks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  type text not null check (type in ('heading', 'subheading', 'paragraph', 'code', 'separator', 'image')),
  display_order integer not null default 0,
  -- Shape depends on `type`: rich text (heading/subheading/paragraph), {code, language},
  -- {url, alt_text, caption, source_text, source_url} (image), or {} (separator).
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index post_blocks_post_id_order_idx on post_blocks(post_id, display_order);

create trigger post_blocks_set_updated_at
  before update on post_blocks
  for each row
  execute function set_updated_at();

-- Completes the circular reference from posts.preview_image_block_id.
alter table posts
  add constraint posts_preview_image_block_id_fkey
  foreign key (preview_image_block_id) references post_blocks(id) on delete set null;

alter table post_blocks enable row level security;

-- Public reads blocks that belong to a published post; admin full access.
create policy "public read blocks of published posts"
  on post_blocks for select
  to anon, authenticated
  using (
    exists (
      select 1 from posts
      where posts.id = post_blocks.post_id
        and posts.status = 'published'
    )
  );

create policy "admin full access to post_blocks"
  on post_blocks for all
  to authenticated
  using (true)
  with check (true);
