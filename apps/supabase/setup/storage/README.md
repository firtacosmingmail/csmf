# Storage buckets

One SQL file per Supabase Storage bucket, named `<bucket-name>.sql` —
`storage.buckets` insert plus the bucket's access policies on
`storage.objects`. Same convention as `../` for tables: current state, not
migration history, so `../install.sh` can stand up every bucket a fresh
environment needs.

No buckets exist yet. The first is expected in Phase 07 (images), which
adds a `post_blocks` image bucket with public read / admin-only write.
