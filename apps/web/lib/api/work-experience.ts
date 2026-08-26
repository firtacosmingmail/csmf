import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";
import type { Locale } from "@/i18n/locales";

export type WorkExperience = Database["public"]["Tables"]["work_experience"]["Row"];

export type WorkExperienceInput = {
  company: string;
  role: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  display_order?: number;
  // Create-only: locale defaults to "en"; pass translation_group_id to
  // link this entry as the translation of an existing one.
  locale?: Locale;
  translation_group_id?: string;
};

async function unwrapOrThrow<T>(res: Response, key: string, verb: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to ${verb}: ${res.status}`);
  }
  const body = await res.json();
  return body[key];
}

// `locale` scopes to one language's entries (public About page); omit it
// to fetch every locale's entries (the admin editor).
export async function getWorkExperience(locale?: Locale): Promise<WorkExperience[]> {
  const res = await apiFetch(`/work-experience${locale ? `?locale=${locale}` : ""}`);
  return unwrapOrThrow<WorkExperience[]>(res, "work_experience", "fetch work experience");
}

export async function createWorkExperience(
  data: WorkExperienceInput,
  accessToken: string,
): Promise<WorkExperience> {
  const res = await apiFetch("/work-experience", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<WorkExperience>(res, "work_experience", "create work experience");
}

export async function updateWorkExperience(
  id: string,
  data: Partial<WorkExperienceInput>,
  accessToken: string,
): Promise<WorkExperience> {
  const res = await apiFetch(`/work-experience/${encodeURIComponent(id)}`, {
    method: "PATCH",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<WorkExperience>(res, "work_experience", "update work experience");
}

export async function deleteWorkExperience(id: string, accessToken: string): Promise<void> {
  const res = await apiFetch(`/work-experience/${encodeURIComponent(id)}`, { method: "DELETE", accessToken });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete work experience: ${res.status}`);
  }
}
