-- work_experience
-- Depends on: 00_extensions_and_functions.sql

create table work_experience (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  description text,
  start_date date,
  end_date date,
  display_order integer not null default 0,
  -- locale + translation_group_id (FLE i18n): see posts.
  locale text not null default 'en' check (locale in ('en', 'ro')),
  translation_group_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger work_experience_set_updated_at
  before update on work_experience
  for each row
  execute function set_updated_at();

alter table work_experience enable row level security;

create policy "public read work_experience"
  on work_experience for select
  to anon, authenticated
  using (true);

create policy "admin full access to work_experience"
  on work_experience for all
  to authenticated
  using (true)
  with check (true);
