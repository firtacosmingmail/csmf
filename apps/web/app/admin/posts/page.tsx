import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPosts } from "@/lib/api/posts";
import { deletePostAction } from "./actions";
import { DeleteButton } from "./delete-button";
import { AdminNav } from "@/components/admin-nav";
import { locales, type Locale } from "@/i18n/locales";

const LOCALE_LABEL: Record<Locale, string> = { en: "EN", ro: "RO" };
const OTHER_LOCALE: Record<Locale, Locale> = { en: "ro", ro: "en" };

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const posts = await listPosts({ accessToken: session?.access_token });

  // Locales already represented within each translation group, so we know
  // which "+ Add translation" link (if any) to offer per post.
  const localesByGroup = new Map<string, Set<Locale>>();
  for (const post of posts) {
    if (!locales.includes(post.locale as Locale)) continue;
    const set = localesByGroup.get(post.translation_group_id) ?? new Set<Locale>();
    set.add(post.locale as Locale);
    localesByGroup.set(post.translation_group_id, set);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <AdminNav />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-ink">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded bg-terracotta px-4 py-2 font-sans text-paper-raised transition-colors hover:bg-terracotta-hover"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="font-sans text-ink-muted">No posts yet.</p>
      ) : (
        <table className="w-full text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="py-2 pr-4"></th>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Language</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Pinned</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const locale = locales.includes(post.locale as Locale) ? (post.locale as Locale) : "en";
              const missingLocale = OTHER_LOCALE[locale];
              const hasTranslation = localesByGroup.get(post.translation_group_id)?.has(missingLocale) ?? false;

              return (
                <tr key={post.id} className="border-b border-border">
                  <td className="py-2 pr-4">
                    {post.preview_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image URL
                      <img
                        src={post.preview_image_url}
                        alt={post.preview_image_alt ?? ""}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                  </td>
                  <td className="py-2 pr-4 text-ink">{post.title}</td>
                  <td className="py-2 pr-4 text-ink-muted">{LOCALE_LABEL[locale]}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        post.status === "published"
                          ? "bg-terracotta/10 text-terracotta"
                          : "bg-border text-ink-muted"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">{post.pinned ? "Pinned" : ""}</td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="flex gap-3 py-2">
                    <Link href={`/admin/posts/${post.id}/edit`} className="text-terracotta hover:underline">
                      Edit
                    </Link>
                    {!hasTranslation && (
                      <Link
                        href={`/admin/posts/new?translationOf=${post.id}&locale=${missingLocale}`}
                        className="text-terracotta hover:underline"
                      >
                        + Add {LOCALE_LABEL[missingLocale]} translation
                      </Link>
                    )}
                    <DeleteButton action={deletePostAction.bind(null, post.id)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
