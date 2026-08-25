import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listComments, type CommentStatus } from "@/lib/api/comments";
import { CommentRowActions } from "./comment-row-actions";
import { AdminNav } from "@/components/admin-nav";

const TABS: { status: CommentStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
];

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status: CommentStatus = TABS.some((t) => t.status === statusParam)
    ? (statusParam as CommentStatus)
    : "pending";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const comments = session ? await listComments({ status, accessToken: session.access_token }) : [];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <AdminNav />
      <h1 className="font-serif text-3xl text-ink">Comments</h1>

      <nav className="flex gap-4 border-b border-border font-sans text-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={`/admin/comments?status=${tab.status}`}
            className={`-mb-px border-b-2 px-1 pb-2 ${
              status === tab.status ? "border-terracotta text-ink" : "border-transparent text-ink-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {comments.length === 0 ? (
        <p className="font-sans text-ink-muted">No {status} comments.</p>
      ) : (
        <table className="w-full text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="py-2 pr-4">Post</th>
              <th className="py-2 pr-4">Author</th>
              <th className="py-2 pr-4">Comment</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id} className="border-b border-border align-top">
                <td className="max-w-40 truncate py-2 pr-4">
                  {comment.posts && (
                    <Link href={`/admin/posts/${comment.post_id}/edit`} className="text-terracotta hover:underline">
                      {comment.posts.title}
                    </Link>
                  )}
                </td>
                <td className="py-2 pr-4 text-ink">
                  {comment.author_name}
                  {comment.author_email && (
                    <div className="text-xs text-ink-muted">{comment.author_email}</div>
                  )}
                </td>
                <td className="max-w-sm py-2 pr-4 text-ink-muted">{comment.body}</td>
                <td className="py-2 pr-4 text-ink-muted">{new Date(comment.created_at).toLocaleDateString()}</td>
                <td className="py-2">
                  <CommentRowActions id={comment.id} status={status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
