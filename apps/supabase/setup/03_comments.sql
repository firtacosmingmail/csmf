-- comments
-- Depends on: 00_extensions_and_functions.sql, 01_posts.sql

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

alter table comments enable row level security;

-- Public reads approved comments and may submit a new pending comment
-- (the with check blocks a visitor from inserting as already-approved);
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
