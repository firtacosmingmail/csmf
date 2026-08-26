import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api/posts";
import { getComments } from "@/lib/api/comments";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";
import { PostLanguageSwitcher } from "@/components/post-language-switcher";
import { CommentsList } from "@/components/comments-list";
import { highlightCodeBlocks } from "@/lib/shiki";
import { estimateReadingMinutes, getExcerpt } from "@/lib/text-content";
import { CommentForm } from "./comment-form";

type Params = Promise<{ lang: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const post = await getPostBySlug(slug, lang);
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
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const post = await getPostBySlug(slug, lang);
  if (!post) notFound();

  const [dict, blocks, comments] = await Promise.all([
    getDictionary(lang),
    highlightCodeBlocks(post.post_blocks),
    getComments(post.id),
  ]);
  const readingMinutes = estimateReadingMinutes(post.post_blocks);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-4xl text-ink">{post.title}</h1>
          <PostLanguageSwitcher lang={lang} translations={post.translations} />
        </div>
        {post.subtitle && <p className="font-sans text-lg text-ink-muted">{post.subtitle}</p>}
        <p className="font-sans text-sm text-ink-muted">{dict.blog.minRead(readingMinutes)}</p>
      </header>
      <PostBlocksRenderer blocks={blocks} />

      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h2 className="font-serif text-2xl text-ink">{dict.blog.comments}</h2>
        <CommentsList comments={comments} lang={lang} dict={dict.comments} />
        <CommentForm postId={post.id} dict={dict.comments} />
      </section>
    </main>
  );
}
