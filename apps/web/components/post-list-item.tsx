import Link from "next/link";
import type { Post } from "@/lib/api/posts";
import type { Locale } from "@/i18n/locales";

// A single row in the recent-posts list: text on the left, thumbnail on
// the right. Distinct from PostCard (used for the pinned grid), which
// stacks the image above the text instead.
export function PostListItem({ post, lang }: { post: Post; lang: Locale }) {
  return (
    <Link href={`/${lang}/blog/${post.slug}`} className="group flex items-center justify-between gap-6 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="font-serif text-lg text-ink group-hover:underline">{post.title}</h3>
        {post.subtitle && <p className="font-sans text-sm text-ink-muted">{post.subtitle}</p>}
        {post.published_at && (
          <time dateTime={post.published_at} className="font-sans text-xs text-ink-muted">
            {new Date(post.published_at).toLocaleDateString(lang)}
          </time>
        )}
      </div>
      {post.preview_image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image URL
        <img
          src={post.preview_image_url}
          alt={post.preview_image_alt ?? ""}
          className="h-20 w-28 shrink-0 rounded object-cover sm:h-24 sm:w-36"
        />
      )}
    </Link>
  );
}
