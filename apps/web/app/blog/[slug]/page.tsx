import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api/posts";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl text-ink">{post.title}</h1>
        {post.subtitle && <p className="font-sans text-lg text-ink-muted">{post.subtitle}</p>}
      </header>
      <PostBlocksRenderer blocks={post.post_blocks} />
    </main>
  );
}
