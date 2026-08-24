-- Sets posts.published_at automatically the first time a post transitions
-- to (or is created as) 'published', unless the caller already supplied a
-- value. Needed for FLE-36's publish toggle and later chronological
-- ordering (landing page recent-posts list).

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
