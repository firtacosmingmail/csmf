import type { Metadata } from "next";
import { listPublishedPosts } from "@/lib/api/posts";
import { getAboutMe } from "@/lib/api/about-me";
import { totalPages } from "@/lib/pagination";
import { stripHtml } from "@/lib/text-content";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { PostListItem } from "@/components/post-list-item";
import { PaginationNav } from "@/components/pagination-nav";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const PER_PAGE = 6;

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const aboutMe = await getAboutMe(lang);
  const description = aboutMe?.bio ? stripHtml(aboutMe.bio) : undefined;

  return {
    title: aboutMe?.headline ?? undefined,
    description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
      types: { "application/rss+xml": `/${lang}/feed.xml` },
    },
    openGraph: {
      title: aboutMe?.headline ?? undefined,
      description,
      type: "website",
      images: ["/opengraph-image"],
    },
  };
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);

  const [dict, aboutMe, pinned, recent] = await Promise.all([
    getDictionary(lang),
    getAboutMe(lang),
    listPublishedPosts({ locale: lang, pinned: true }),
    listPublishedPosts({ locale: lang, pinned: false, page, perPage: PER_PAGE }),
  ]);

  return (
    <>
      <SiteHeader lang={lang} dict={dict} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 pb-16">
        {(aboutMe?.headline || aboutMe?.bio) && (
          <section className="flex flex-col gap-3 py-8">
            {aboutMe.headline && <h1 className="font-serif text-4xl text-ink">{aboutMe.headline}</h1>}
            {aboutMe.bio && (
              <div
                className="max-w-xl font-sans text-ink-muted [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: aboutMe.bio }}
              />
            )}
          </section>
        )}

        {pinned.posts.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl text-ink">{dict.home.pinned}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {pinned.posts.map((post) => (
                <PostCard key={post.id} post={post} lang={lang} />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-ink">{dict.home.recentPosts}</h2>
          {recent.posts.length === 0 ? (
            <p className="font-sans text-ink-muted">{dict.home.noPosts}</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recent.posts.map((post) => (
                <PostListItem key={post.id} post={post} lang={lang} />
              ))}
            </div>
          )}
          <PaginationNav page={page} totalPages={totalPages(recent.total, PER_PAGE)} lang={lang} dict={dict} />
        </section>
      </main>

      <SiteFooter lang={lang} dict={dict} />
    </>
  );
}
