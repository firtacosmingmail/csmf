-- Shared extensions and functions used by table files in this folder.
-- Run this first.

create extension if not exists pgcrypto;

-- Keeps `updated_at` current on every row update. Attached as a BEFORE UPDATE
-- trigger by any table below that has an `updated_at` column.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
