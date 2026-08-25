"use client";

import { useState } from "react";
import { subscribeToNewsletterAction } from "@/app/newsletter-actions";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await subscribeToNewsletterAction(email);
      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p className="font-sans text-sm text-ink-muted">Thanks — you&apos;re subscribed.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded border border-border bg-paper px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded bg-terracotta px-4 py-2 text-sm text-paper-raised transition-colors hover:bg-terracotta-hover disabled:opacity-50"
        >
          {submitting ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {error && <p className="text-sm text-terracotta">{error}</p>}
    </form>
  );
}
