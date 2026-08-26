"use client";

import { useState } from "react";
import { subscribeToNewsletterAction } from "@/app/newsletter-actions";
import type { Dictionary } from "@/i18n/dictionaries";

export function NewsletterForm({ dict }: { dict: Dictionary["newsletter"] }) {
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
      setError(err instanceof Error ? err.message : dict.errorFallback);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p className="font-sans text-sm text-ink-muted">{dict.thanks}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          {dict.emailLabel}
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.placeholder}
          className="rounded border border-border bg-paper px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded bg-terracotta px-4 py-2 text-sm text-paper-raised transition-colors hover:bg-terracotta-hover disabled:opacity-50"
        >
          {submitting ? dict.subscribing : dict.subscribe}
        </button>
      </div>
      {error && <p className="text-sm text-terracotta">{error}</p>}
    </form>
  );
}
