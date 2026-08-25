-- images storage bucket: public read (post images are public-facing),
-- admin-only write. Backs the `image` post_blocks content shape (Phase 07).

insert into storage.buckets (id, name, public)
values ('images', 'images', true);

create policy "public read images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'images');

create policy "admin insert images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

create policy "admin update images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images');

create policy "admin delete images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images');
