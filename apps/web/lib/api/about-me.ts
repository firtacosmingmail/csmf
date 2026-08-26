import { cache } from "react";
import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";
import type { Locale } from "@/i18n/locales";

export type AboutMe = Database["public"]["Tables"]["about_me"]["Row"];

export type AboutMeInput = {
  locale: Locale;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  contact_email?: string;
};

// Wrapped in React's cache() — generateMetadata and the page component
// both call this per-request (with the same locale), so this dedupes them
// into one fetch.
export const getAboutMe = cache(async (locale: Locale): Promise<AboutMe | null> => {
  const res = await apiFetch(`/about-me?locale=${locale}`);
  if (!res.ok) throw new Error(`Failed to fetch about_me: ${res.status}`);
  const { about_me } = await res.json();
  return about_me;
});

// Admin: every locale's row at once, for the translation-editing form.
export async function getAllAboutMe(accessToken?: string): Promise<AboutMe[]> {
  const res = await apiFetch("/about-me", { accessToken });
  if (!res.ok) throw new Error(`Failed to fetch about_me: ${res.status}`);
  const { about_me } = await res.json();
  return about_me;
}

// PUT upserts, so this works for both the first-ever save and later edits
// of a given locale's row — the admin form doesn't need to know which
// case it's in.
export async function updateAboutMe(data: AboutMeInput, accessToken: string): Promise<AboutMe> {
  const res = await apiFetch("/about-me", {
    method: "PUT",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to update about_me: ${res.status}`);
  }
  const { about_me } = await res.json();
  return about_me;
}
