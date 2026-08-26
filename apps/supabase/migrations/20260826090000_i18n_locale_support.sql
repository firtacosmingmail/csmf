-- i18n: Romanian + English support.
--
-- posts and work_experience become locale-aware: each row gets a `locale`
-- and a `translation_group_id` that links a row to its sibling
-- translation(s) of the same conceptual post/experience entry. Existing
-- rows default to locale = 'en' and get their own fresh
-- translation_group_id (they have no sibling yet — the admin creates one
-- via "add translation", which reuses the group id).
--
-- about_me stops being a fixed-id singleton and becomes locale-keyed
-- instead (one row per locale) — same idea, simpler because there's no
-- grouping to track for a table that's just ever two rows.

alter table posts
  add column locale text not null default 'en' check (locale in ('en', 'ro')),
  add column translation_group_id uuid not null default gen_random_uuid();

alter table posts drop constraint posts_slug_key;
alter table posts add constraint posts_locale_slug_key unique (locale, slug);

alter table work_experience
  add column locale text not null default 'en' check (locale in ('en', 'ro')),
  add column translation_group_id uuid not null default gen_random_uuid();

alter table about_me add column locale text;
update about_me set locale = 'en';
alter table about_me
  alter column locale set not null,
  add constraint about_me_locale_check check (locale in ('en', 'ro'));
alter table about_me drop constraint about_me_pkey;
alter table about_me drop column id;
alter table about_me add primary key (locale);
