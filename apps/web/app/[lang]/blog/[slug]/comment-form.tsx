"use client";

import { useState } from "react";
import { createCommentAction } from "./comment-actions";
import type { Dictionary } from "@/i18n/dictionaries";

export function CommentForm({ postId, dict }: { postId: string; dict: Dictionary["comments"] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCommentAction(postId, {
        author_name: name,
        author_email: email.trim() ? email : undefined,
        body,
      });
      setSubmitted(true);
      setName("");
      setEmail("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.errorFallback);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p className="font-sans text-ink-muted">{dict.thanksPending}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        {dict.name}
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-border bg-paper px-3 py-2 text-ink"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        {dict.emailOptional}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-border bg-paper px-3 py-2 text-ink"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        {dict.comment}
        <textarea
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded border border-border bg-paper px-3 py-2 text-ink"
        />
      </label>
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded bg-terracotta px-4 py-2 font-sans text-paper-raised transition-colors hover:bg-terracotta-hover disabled:opacity-50"
      >
        {submitting ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
