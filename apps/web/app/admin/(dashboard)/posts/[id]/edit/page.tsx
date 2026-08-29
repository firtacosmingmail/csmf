import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById, getPostBySlug } from "@/lib/api/posts";
import type { Locale } from "@/i18n/locales";
import { PostForm } from "../../post-form";
import { updatePostAction } from "../../actions";
import { BlockEditor } from "@/components/block-editor/block-editor";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const post = await getPostById(id, session?.access_token);
  if (!post) notFound();

  // getPostById only returns metadata — blocks come from the slug-keyed
  // detail route instead (RLS lets an authenticated admin session read a
  // draft's blocks there too, not just published ones).
  const postWithBlocks = await getPostBySlug(post.slug, post.locale as Locale, session?.access_token);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">Edit post</h1>
      <BlockEditor
        postId={post.id}
        initialBlocks={postWithBlocks?.post_blocks ?? []}
        title={post.title}
        subtitle={post.subtitle}
        initialPreviewImageBlockId={post.preview_image_block_id}
        metadataPanel={<PostForm action={updatePostAction.bind(null, post.id)} defaultValues={post} submitLabel="Save" />}
      />
    </main>
  );
}
