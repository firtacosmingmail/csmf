import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api/posts";
import { getComments } from "@/lib/api/comments";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { siteUrl, authorName } from "@/lib/site";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";
import { PostLanguageSwitcher } from "@/components/post-language-switcher";
import { CommentsList } from "@/components/comments-list";
import { JsonLd } from "@/components/json-ld";
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
  const ogImage = post.preview_image_url ?? "/opengraph-image";
  // getPostBySlug's `translations` lists sibling locales only (not the
  // current one) — add the current locale so it self-references too.
  const languages = Object.fromEntries([
    [lang, `/${lang}/blog/${post.slug}`],
    ...post.translations.map((t) => [t.locale, `/${t.locale}/blog/${t.slug}`]),
  ]);

  return {
    title: post.title,
    description,
    alternates: {
      canonical: `/${lang}/blog/${post.slug}`,
      languages,
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage],
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
  const description = getExcerpt(post.subtitle, post.post_blocks) || undefined;
  const postUrl = `${siteUrl}/${lang}/blog/${post.slug}`;

  // FLE-54: BlogPosting JSON-LD.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(description ? { description } : {}),
    image: [post.preview_image_url ?? `${siteUrl}/opengraph-image`],
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at,
    inLanguage: lang,
    author: { "@type": "Person", name: authorName, url: `${siteUrl}/${lang}/about` },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-serif text-4xl text-ink">{post.title}</h1>
            <PostLanguageSwitcher lang={lang} translations={post.translations} />
          </div>
          {post.subtitle && <p className="font-sans text-lg text-ink-muted">{post.subtitle}</p>}
          <p className="font-sans text-sm text-ink-muted">
            {post.published_at && (
              <>
                <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString(lang)}</time>
                {" · "}
              </>
            )}
            {dict.blog.minRead(readingMinutes)}
          </p>
        </header>
        <PostBlocksRenderer blocks={blocks} />

        <section className="flex flex-col gap-6 border-t border-border pt-8">
          <h2 className="font-serif text-2xl text-ink">{dict.blog.comments}</h2>
          <CommentsList comments={comments} lang={lang} dict={dict.comments} />
          <CommentForm postId={post.id} dict={dict.comments} />
        </section>
      </main>
    </>
  );
}
