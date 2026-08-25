import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById, getPostBySlug } from "@/lib/api/posts";
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
  const postWithBlocks = await getPostBySlug(post.slug, session?.access_token);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <h1 className="font-serif text-3xl text-ink">Edit post</h1>
        <PostForm action={updatePostAction.bind(null, post.id)} defaultValues={post} submitLabel="Save" />
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-xl text-ink">Content</h2>
        <BlockEditor
          postId={post.id}
          initialBlocks={postWithBlocks?.post_blocks ?? []}
          title={post.title}
          subtitle={post.subtitle}
        />
      </div>
    </main>
  );
}
