# Storage buckets

One SQL file per Supabase Storage bucket, named `<bucket-name>.sql` —
`storage.buckets` insert plus the bucket's access policies on
`storage.objects`. Same convention as `../` for tables: current state, not
migration history, so `../install.sh` can stand up every bucket a fresh
environment needs.

- `images.sql` — the `images` bucket (public read, admin-only write),
  backing the `image` `post_blocks` content shape.
