-- about_me (singleton — the boolean PK + check(id) trick caps this at one row)
-- Depends on: 00_extensions_and_functions.sql

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

alter table about_me enable row level security;

create policy "public read about_me"
  on about_me for select
  to anon, authenticated
  using (true);

create policy "admin full access to about_me"
  on about_me for all
  to authenticated
  using (true)
  with check (true);
