-- Initial schema: posts, post_blocks, comments, about_me, social_links, work_experience.
-- Single admin user model: any authenticated session is the admin (Phase 02 creates the
-- one admin user directly in the dashboard, no signup flow). RLS below reflects that:
-- authenticated = admin (full access), anon/public = read-only on published content.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- posts ----------------------------------------------------------------

create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  pinned boolean not null default false,
  preview_image_url text,
  preview_image_alt text,
  -- FK to post_blocks added after that table exists (circular reference).
  preview_image_block_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger posts_set_updated_at
  before update on posts
  for each row
  execute function set_updated_at();

-- post_blocks ------------------------------------------------------------

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

alter table posts
  add constraint posts_preview_image_block_id_fkey
  foreign key (preview_image_block_id) references post_blocks(id) on delete set null;

-- comments ---------------------------------------------------------------

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_name text not null,
  author_email text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index comments_post_id_status_idx on comments(post_id, status);

-- about_me (singleton) ----------------------------------------------------

create table about_me (
  id boolean primary key default true check (id),
  headline text,
  bio text,
  avatar_url text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger about_me_set_updated_at
  before update on about_me
  for each row
  execute function set_updated_at();

-- social_links -------------------------------------------------------------

create table social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger social_links_set_updated_at
  before update on social_links
  for each row
  execute function set_updated_at();

-- work_experience ------------------------------------------------------------

create table work_experience (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  description text,
  start_date date,
  end_date date,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger work_experience_set_updated_at
  before update on work_experience
  for each row
  execute function set_updated_at();

-- RLS ----------------------------------------------------------------------

alter table posts enable row level security;
alter table post_blocks enable row level security;
alter table comments enable row level security;
alter table about_me enable row level security;
alter table social_links enable row level security;
alter table work_experience enable row level security;

-- posts: public reads published posts; admin (any authenticated session) reads/writes all.
create policy "public read published posts"
  on posts for select
  to anon, authenticated
  using (status = 'published');

create policy "admin full access to posts"
  on posts for all
  to authenticated
  using (true)
  with check (true);

-- post_blocks: public reads blocks belonging to a published post; admin full access.
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

-- comments: public reads approved comments and may submit a new pending comment;
-- admin moderates (approve/reject/delete) with full access.
create policy "public read approved comments"
  on comments for select
  to anon, authenticated
  using (status = 'approved');

create policy "public submit pending comments"
  on comments for insert
  to anon, authenticated
  with check (status = 'pending');

create policy "admin full access to comments"
  on comments for all
  to authenticated
  using (true)
  with check (true);

-- about_me / social_links / work_experience: public reads, admin writes.
create policy "public read about_me"
  on about_me for select
  to anon, authenticated
  using (true);

create policy "admin full access to about_me"
  on about_me for all
  to authenticated
  using (true)
  with check (true);

create policy "public read social_links"
  on social_links for select
  to anon, authenticated
  using (true);

create policy "admin full access to social_links"
  on social_links for all
  to authenticated
  using (true)
  with check (true);

create policy "public read work_experience"
  on work_experience for select
  to anon, authenticated
  using (true);

create policy "admin full access to work_experience"
  on work_experience for all
  to authenticated
  using (true)
  with check (true);
