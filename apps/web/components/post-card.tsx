import Link from "next/link";
import type { Post } from "@/lib/api/posts";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-2">
      {post.preview_image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image URL
        <img
          src={post.preview_image_url}
          alt={post.preview_image_alt ?? ""}
          className="aspect-video w-full rounded object-cover"
        />
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-lg text-ink group-hover:underline">{post.title}</h3>
        {post.subtitle && <p className="font-sans text-sm text-ink-muted">{post.subtitle}</p>}
        {post.published_at && (
          <time dateTime={post.published_at} className="font-sans text-xs text-ink-muted">
            {new Date(post.published_at).toLocaleDateString()}
          </time>
        )}
      </div>
    </Link>
  );
}
