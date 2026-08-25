import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

export type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

export type SocialLinkInput = {
  platform: string;
  url: string;
  display_order?: number;
};

async function unwrapOrThrow<T>(res: Response, key: string, verb: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to ${verb}: ${res.status}`);
  }
  const body = await res.json();
  return body[key];
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const res = await apiFetch("/social-links");
  return unwrapOrThrow<SocialLink[]>(res, "social_links", "fetch social links");
}

export async function createSocialLink(data: SocialLinkInput, accessToken: string): Promise<SocialLink> {
  const res = await apiFetch("/social-links", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<SocialLink>(res, "social_link", "create social link");
}

export async function updateSocialLink(
  id: string,
  data: Partial<SocialLinkInput>,
  accessToken: string,
): Promise<SocialLink> {
  const res = await apiFetch(`/social-links/${encodeURIComponent(id)}`, {
    method: "PATCH",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<SocialLink>(res, "social_link", "update social link");
}

export async function deleteSocialLink(id: string, accessToken: string): Promise<void> {
  const res = await apiFetch(`/social-links/${encodeURIComponent(id)}`, { method: "DELETE", accessToken });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete social link: ${res.status}`);
  }
}
