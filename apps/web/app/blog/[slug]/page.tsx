import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api/posts";
import { getComments } from "@/lib/api/comments";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";
import { CommentsList } from "@/components/comments-list";
import { highlightCodeBlocks } from "@/lib/shiki";
import { estimateReadingMinutes, getExcerpt } from "@/lib/text-content";
import { CommentForm } from "./comment-form";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const description = getExcerpt(post.subtitle, post.post_blocks) || undefined;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      images: post.preview_image_url ? [{ url: post.preview_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.preview_image_url ? [post.preview_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [blocks, comments] = await Promise.all([
    highlightCodeBlocks(post.post_blocks),
    getComments(post.id),
  ]);
  const readingMinutes = estimateReadingMinutes(post.post_blocks);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl text-ink">{post.title}</h1>
        {post.subtitle && <p className="font-sans text-lg text-ink-muted">{post.subtitle}</p>}
        <p className="font-sans text-sm text-ink-muted">{readingMinutes} min read</p>
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
