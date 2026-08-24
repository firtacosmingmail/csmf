import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPosts } from "@/lib/api/posts";
import { deletePostAction } from "./actions";
import { DeleteButton } from "./delete-button";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const posts = await listPosts({ accessToken: session?.access_token });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
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
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Pinned</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-border">
                <td className="py-2 pr-4 text-ink">{post.title}</td>
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
                  <DeleteButton action={deletePostAction.bind(null, post.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
