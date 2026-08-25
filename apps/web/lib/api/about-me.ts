import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

export type AboutMe = Database["public"]["Tables"]["about_me"]["Row"];
export type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

export async function getAboutMe(): Promise<AboutMe | null> {
  const res = await apiFetch("/about-me");
  if (!res.ok) throw new Error(`Failed to fetch about_me: ${res.status}`);
  const { about_me } = await res.json();
  return about_me;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const res = await apiFetch("/about-me/social-links");
  if (!res.ok) throw new Error(`Failed to fetch social links: ${res.status}`);
  const { social_links } = await res.json();
  return social_links;
}
