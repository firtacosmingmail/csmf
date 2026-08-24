import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/api/posts";
import { PostForm } from "../../post-form";
import { updatePostAction } from "../../actions";

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

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">Edit post</h1>
      <PostForm action={updatePostAction.bind(null, post.id)} defaultValues={post} submitLabel="Save" />
    </main>
  );
}
