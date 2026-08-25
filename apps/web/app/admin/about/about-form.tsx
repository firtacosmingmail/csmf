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

const fieldClass = "rounded border border-border bg-paper px-3 py-2 text-ink";

export function AboutForm({
  initialAboutMe,
  initialSocialLinks,
}: {
  initialAboutMe: AboutMe | null;
  initialSocialLinks: SocialLink[];
}) {
  const [headline, setHeadline] = useState(initialAboutMe?.headline ?? "");
  const [contactEmail, setContactEmail] = useState(initialAboutMe?.contact_email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAboutMe?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState(initialSocialLinks);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await uploadAvatarAction(formData);
      setAvatarUrl(url);
      await updateAboutMeAction({ avatar_url: url });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleAddLink() {
    if (!newPlatform.trim() || !newUrl.trim()) return;
    const link = await createSocialLinkAction({ platform: newPlatform, url: newUrl, display_order: links.length });
    setLinks((prev) => [...prev, link]);
    setNewPlatform("");
    setNewUrl("");
  }

  async function handleUpdateLink(id: string, patch: { platform?: string; url?: string }) {
    const updated = await updateSocialLinkAction(id, patch);
    setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }

  async function handleDeleteLink(id: string) {
    await deleteSocialLinkAction(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Headline
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            onBlur={() => updateAboutMeAction({ headline })}
            className={fieldClass}
          />
        </label>

        <div className="flex flex-col gap-1 text-sm text-ink-muted">
          Bio
          <RichTextEditor
            initialHtml={initialAboutMe?.bio ?? ""}
            placeholder="Write a short bio…"
            onSave={(html) => updateAboutMeAction({ bio: html })}
          />
        </div>

        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Contact email
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            onBlur={() => updateAboutMeAction({ contact_email: contactEmail })}
            className={fieldClass}
          />
        </label>

        <div className="flex flex-col gap-1 text-sm text-ink-muted">
          Avatar
          <div className="flex items-center gap-3">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image URL
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
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
