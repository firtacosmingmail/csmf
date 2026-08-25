import type { Comment } from "@/lib/api/comments";

export function CommentsList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="font-sans text-sm text-ink-muted">No comments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex flex-col gap-1 border-b border-border pb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-medium text-ink">{comment.author_name}</span>
            <time dateTime={comment.created_at} className="text-xs text-ink-muted">
              {new Date(comment.created_at).toLocaleDateString()}
            </time>
          </div>
          <p className="font-sans text-ink-muted">{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}
