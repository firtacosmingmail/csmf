import { listPublishedPosts } from "@/lib/api/posts";
import { getAboutMe } from "@/lib/api/about-me";
import { totalPages } from "@/lib/pagination";
import { PostCard } from "@/components/post-card";
import { PostListItem } from "@/components/post-list-item";
import { PaginationNav } from "@/components/pagination-nav";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const PER_PAGE = 6;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);

  const [aboutMe, pinned, recent] = await Promise.all([
    getAboutMe(),
    listPublishedPosts({ pinned: true }),
    listPublishedPosts({ pinned: false, page, perPage: PER_PAGE }),
  ]);

  return (
    <>
      <SiteHeader />

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
            <h2 className="font-serif text-2xl text-ink">Pinned</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {pinned.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-ink">Recent posts</h2>
          {recent.posts.length === 0 ? (
            <p className="font-sans text-ink-muted">No posts yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recent.posts.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </div>
          )}
          <PaginationNav page={page} totalPages={totalPages(recent.total, PER_PAGE)} />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
