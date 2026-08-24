# Database setup

Current-state SQL for every table — not a migration log. Each file here is
the full `create table` (columns, indexes, constraints, RLS) as it stands
today, one file per table, so the database can be installed to a working
state on any Postgres/Supabase environment in one pass — a fresh Supabase
project, a local Postgres, a disaster-recovery restore — without replaying
`../migrations/`.

Run order is the numeric filename prefix: `00_extensions_and_functions.sql`
first (shared `pgcrypto` extension and the `set_updated_at()` trigger
function), then one file per table in dependency order, e.g.
`02_post_blocks.sql` after `01_posts.sql` because it references `posts(id)`
(and completes the circular `posts.preview_image_block_id` FK once
`post_blocks` exists).

```
./install.sh "$DATABASE_URL"
```

**Keep these files current.** Whenever a migration in `../migrations/`
creates or alters a table, update (or add) that table's file here to match
the new current state — same columns, indexes, constraints, and RLS
policies the live schema now has. `../migrations/` is the historical
record of *how* the schema got here; this folder is *what it is now*.

See `storage/` for the equivalent convention for Supabase Storage buckets.
