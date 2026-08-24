-- social_links
-- Depends on: 00_extensions_and_functions.sql

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

alter table social_links enable row level security;

create policy "public read social_links"
  on social_links for select
  to anon, authenticated
  using (true);

create policy "admin full access to social_links"
  on social_links for all
  to authenticated
  using (true)
  with check (true);
