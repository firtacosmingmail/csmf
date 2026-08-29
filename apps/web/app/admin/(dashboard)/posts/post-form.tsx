"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { slugify } from "@/lib/slugify";
import { locales, type Locale } from "@/i18n/locales";
import { Spinner } from "@/components/spinner";

const LOCALE_LABEL: Record<Locale, string> = { en: "English", ro: "Română" };

// useFormStatus only sees the nearest enclosing <form>, so this has to be
// a child of it rather than inlined in PostForm itself (which renders that
// form element).
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 self-start rounded bg-terracotta px-4 py-2 font-sans text-paper-raised transition-colors hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Spinner className="h-4 w-4" />}
      {label}
    </button>
  );
}

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
  translation,
}: {
  action: (formData: FormData) => void;
  defaultValues?: PostFormValues;
  submitLabel: string;
  // Only set when creating a brand-new post (never on edit — a post's
  // locale/group don't change after creation, see PostInput). Omit
  // entirely for a standalone post; set `locale` to lock it (creating a
  // translation of an existing post) instead of offering the picker.
  translation?: { locale?: Locale; groupId?: string };
}) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));

  return (
    <form action={action} className="flex w-full max-w-xl flex-col gap-4">
      {translation && (
        <>
          {translation.groupId && <input type="hidden" name="translation_group_id" value={translation.groupId} />}
          {translation.locale ? (
            <div className="flex flex-col gap-1 text-sm text-ink-muted">
              Language
              <input type="hidden" name="locale" value={translation.locale} />
              <p className="text-ink">{LOCALE_LABEL[translation.locale]}</p>
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Language
              <select name="locale" defaultValue="en" className="rounded border border-border bg-paper px-3 py-2 text-ink">
                {locales.map((locale) => (
                  <option key={locale} value={locale}>
                    {LOCALE_LABEL[locale]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}

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

      <SubmitButton label={submitLabel} />
    </form>
  );
}
