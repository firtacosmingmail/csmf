"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";

type PostFormValues = {
  title: string;
  subtitle: string | null;
  slug: string;
  // Generated from the DB's text column, not a literal union — the actual
  // constraint is the `status in ('draft', 'published')` CHECK.
  status: string;
  pinned: boolean;
};

export function PostForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: PostFormValues;
  submitLabel: string;
}) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));

  return (
    <form action={action} className="flex w-full max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Title
        <input
          name="title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="rounded border border-border bg-paper px-3 py-2 text-ink"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Subtitle
        <input
          name="subtitle"
          defaultValue={defaultValues?.subtitle ?? ""}
          className="rounded border border-border bg-paper px-3 py-2 text-ink"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Slug
        <input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className="rounded border border-border bg-paper px-3 py-2 font-mono text-ink"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Status
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "draft"}
          className="rounded border border-border bg-paper px-3 py-2 text-ink"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" name="pinned" defaultChecked={defaultValues?.pinned ?? false} />
        Pinned
      </label>

      <button
        type="submit"
        className="self-start rounded bg-terracotta px-4 py-2 font-sans text-paper-raised transition-colors hover:bg-terracotta-hover"
      >
        {submitLabel}
      </button>
    </form>
  );
}
