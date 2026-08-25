import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

export type WorkExperience = Database["public"]["Tables"]["work_experience"]["Row"];

export type WorkExperienceInput = {
  company: string;
  role: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
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

export async function getWorkExperience(): Promise<WorkExperience[]> {
  const res = await apiFetch("/work-experience");
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
