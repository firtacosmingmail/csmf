import Link from "next/link";
import { listPublishedPosts } from "@/lib/api/posts";
import { getAboutMe, getSocialLinks } from "@/lib/api/about-me";
import { totalPages } from "@/lib/pagination";
import { PostCard } from "@/components/post-card";
import { PostListItem } from "@/components/post-list-item";
import { PaginationNav } from "@/components/pagination-nav";

const PER_PAGE = 6;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);

  const [aboutMe, socialLinks, pinned, recent] = await Promise.all([
    getAboutMe(),
    getSocialLinks(),
    listPublishedPosts({ pinned: true }),
    listPublishedPosts({ pinned: false, page, perPage: PER_PAGE }),
  ]);

  return (
    <>
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-serif text-xl text-ink">
          csmf.ro
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 pb-16">
        {(aboutMe?.headline || aboutMe?.bio) && (
          <section className="flex flex-col gap-3 py-8">
            {aboutMe.headline && <h1 className="font-serif text-4xl text-ink">{aboutMe.headline}</h1>}
            {aboutMe.bio && <p className="max-w-xl font-sans text-ink-muted">{aboutMe.bio}</p>}
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

      <footer className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-8 font-sans text-sm text-ink-muted">
        {socialLinks.length > 0 && (
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink hover:underline"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}
        <p>© {new Date().getFullYear()} csmf.ro</p>
      </footer>
    </>
  );
}
