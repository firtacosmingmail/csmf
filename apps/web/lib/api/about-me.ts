import { cache } from "react";
import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

export type AboutMe = Database["public"]["Tables"]["about_me"]["Row"];

export type AboutMeInput = {
  headline?: string;
  bio?: string;
  avatar_url?: string;
  contact_email?: string;
};

// Wrapped in React's cache() — generateMetadata and the page component
// both call this per-request, so this dedupes them into one fetch.
export const getAboutMe = cache(async (): Promise<AboutMe | null> => {
  const res = await apiFetch("/about-me");
  if (!res.ok) throw new Error(`Failed to fetch about_me: ${res.status}`);
  const { about_me } = await res.json();
  return about_me;
});

// PUT upserts, so this works for both the first-ever save and later edits
// — the admin form doesn't need to know which case it's in.
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
