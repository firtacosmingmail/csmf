"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  updateAboutMeAction,
  uploadAvatarAction,
  createSocialLinkAction,
  updateSocialLinkAction,
  deleteSocialLinkAction,
} from "./actions";
import type { AboutMe } from "@/lib/api/about-me";
import type { SocialLink } from "@/lib/api/social-links";
import { locales, type Locale } from "@/i18n/locales";

const fieldClass = "rounded border border-border bg-paper px-3 py-2 text-ink";
const LOCALE_LABEL: Record<Locale, string> = { en: "English", ro: "Română" };

type Draft = { headline: string; contact_email: string; avatar_url: string };

function draftFrom(aboutMe: AboutMe | null): Draft {
  return {
    headline: aboutMe?.headline ?? "",
    contact_email: aboutMe?.contact_email ?? "",
    avatar_url: aboutMe?.avatar_url ?? "",
  };
}

// Each locale is its own row (see i18n migration) — the form edits one at
// a time via the tabs below, independently of the other's content.
export function AboutForm({
  initialAboutMeByLocale,
  initialSocialLinks,
}: {
  initialAboutMeByLocale: AboutMe[];
  initialSocialLinks: SocialLink[];
}) {
  const byLocale = Object.fromEntries(
    initialAboutMeByLocale.map((row) => [row.locale, row]),
  ) as Partial<Record<Locale, AboutMe>>;

  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [drafts, setDrafts] = useState<Record<Locale, Draft>>(() =>
    Object.fromEntries(locales.map((l) => [l, draftFrom(byLocale[l] ?? null)])) as Record<Locale, Draft>,
  );
  const [initialBios] = useState<Record<Locale, string>>(() =>
    Object.fromEntries(locales.map((l) => [l, byLocale[l]?.bio ?? ""])) as Record<Locale, string>,
  );
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState(initialSocialLinks);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const draft = drafts[activeLocale];
  function updateDraft(patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch } }));
  }

  // Imperative onClick/onBlur/onChange calls, not <form action>, so
  // errors here wouldn't otherwise reach the nearest error.tsx boundary.
  async function guarded(fn: () => Promise<unknown>) {
    try {
      setError(null);
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const locale = activeLocale;
    void guarded(async () => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { url } = await uploadAvatarAction(formData);
        updateDraft({ avatar_url: url });
        await updateAboutMeAction({ locale, avatar_url: url });
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    });
  }

  function handleAddLink() {
    if (!newPlatform.trim() || !newUrl.trim()) return;
    void guarded(async () => {
      const link = await createSocialLinkAction({ platform: newPlatform, url: newUrl, display_order: links.length });
      setLinks((prev) => [...prev, link]);
      setNewPlatform("");
      setNewUrl("");
    });
  }

  function handleUpdateLink(id: string, patch: { platform?: string; url?: string }) {
    void guarded(async () => {
      const updated = await updateSocialLinkAction(id, patch);
      setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
    });
  }

  function handleDeleteLink(id: string) {
    void guarded(async () => {
      await deleteSocialLinkAction(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-10">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded border border-terracotta bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="shrink-0">
            ×
          </button>
        </div>
      )}

      <div className="flex gap-2 border-b border-border">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`px-3 py-2 text-sm ${
              locale === activeLocale
                ? "border-b-2 border-terracotta text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {LOCALE_LABEL[locale]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Headline
          <input
            value={draft.headline}
            onChange={(e) => updateDraft({ headline: e.target.value })}
            onBlur={() => void guarded(() => updateAboutMeAction({ locale: activeLocale, headline: draft.headline }))}
            className={fieldClass}
          />
        </label>

        <div className="flex flex-col gap-1 text-sm text-ink-muted">
          Bio
          <RichTextEditor
            key={activeLocale}
            initialHtml={initialBios[activeLocale]}
            placeholder="Write a short bio…"
            onSave={(html) => void guarded(() => updateAboutMeAction({ locale: activeLocale, bio: html }))}
          />
        </div>

        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Contact email
          <input
            type="email"
            value={draft.contact_email}
            onChange={(e) => updateDraft({ contact_email: e.target.value })}
            onBlur={() =>
              void guarded(() => updateAboutMeAction({ locale: activeLocale, contact_email: draft.contact_email }))
            }
            className={fieldClass}
          />
        </label>

        <div className="flex flex-col gap-1 text-sm text-ink-muted">
          Avatar
          <div className="flex items-center gap-3">
            {draft.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image URL
              <img src={draft.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              aria-label="Upload avatar"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-xl text-ink">Social links</h2>
        <p className="text-xs text-ink-muted">Shared across languages — not tied to a locale.</p>
        {links.length === 0 && <p className="text-sm text-ink-muted">No social links yet.</p>}
        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-2">
            <input
              defaultValue={link.platform}
              aria-label="Platform"
              onBlur={(e) => {
                if (e.target.value !== link.platform) handleUpdateLink(link.id, { platform: e.target.value });
              }}
              className={`w-32 text-sm ${fieldClass}`}
            />
            <input
              defaultValue={link.url}
              aria-label="URL"
              onBlur={(e) => {
                if (e.target.value !== link.url) handleUpdateLink(link.id, { url: e.target.value });
              }}
              className={`flex-1 text-sm ${fieldClass}`}
            />
            <button type="button" onClick={() => handleDeleteLink(link.id)} className="text-terracotta hover:underline">
              Remove
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            placeholder="Platform (e.g. GitHub)"
            aria-label="New platform"
            className={`w-32 text-sm ${fieldClass}`}
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            aria-label="New URL"
            className={`flex-1 text-sm ${fieldClass}`}
          />
          <button type="button" onClick={handleAddLink} className="text-terracotta hover:underline">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
