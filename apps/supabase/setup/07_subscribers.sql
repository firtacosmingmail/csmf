-- subscribers
-- Depends on: 00_extensions_and_functions.sql
--
-- Newsletter signups (v1 — capture only, no send-on-publish yet). No
-- public read (email addresses are PII); admin (any authenticated
-- session, per the single-admin model) has full access.

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscribers_set_updated_at
  before update on subscribers
  for each row
  execute function set_updated_at();

alter table subscribers enable row level security;

-- Public may subscribe; the with check blocks a caller from inserting as
-- already-unsubscribed.
create policy "public subscribe"
  on subscribers for insert
  to anon, authenticated
  with check (status = 'active');

create policy "admin full access to subscribers"
  on subscribers for all
  to authenticated
  using (true)
  with check (true);
