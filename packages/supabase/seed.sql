-- Sample published post + blocks, for the Phase 03 walking-skeleton to render.
do $$
declare
  v_post_id uuid;
  v_heading_id uuid;
begin
  insert into posts (title, subtitle, slug, status, pinned, published_at)
  values (
    'Hello, world',
    'The first post on this blog',
    'hello-world',
    'published',
    true,
    now()
  )
  returning id into v_post_id;

  insert into post_blocks (post_id, type, display_order, content)
  values (
    v_post_id,
    'heading',
    0,
    '{"text": "Hello, world"}'::jsonb
  )
  returning id into v_heading_id;

  insert into post_blocks (post_id, type, display_order, content)
  values (
    v_post_id,
    'paragraph',
    1,
    '{"text": "This is the first post, seeded straight from SQL to prove the schema, RLS, and block rendering all work together before any admin UI exists."}'::jsonb
  );
end $$;
