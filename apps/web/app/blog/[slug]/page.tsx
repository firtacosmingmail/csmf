import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api/posts";
import { getComments } from "@/lib/api/comments";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";
import { CommentsList } from "@/components/comments-list";
import { highlightCodeBlocks } from "@/lib/shiki";
import { CommentForm } from "./comment-form";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [blocks, comments] = await Promise.all([
    highlightCodeBlocks(post.post_blocks),
    getComments(post.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl text-ink">{post.title}</h1>
        {post.subtitle && <p className="font-sans text-lg text-ink-muted">{post.subtitle}</p>}
      </header>
      <PostBlocksRenderer blocks={blocks} />

      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h2 className="font-serif text-2xl text-ink">Comments</h2>
        <CommentsList comments={comments} />
        <CommentForm postId={post.id} />
      </section>
    </main>
  );
}
