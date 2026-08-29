"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  type WorkExperienceInput,
} from "@/lib/api/work-experience";

async function requireAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export async function createExperienceAction(data: WorkExperienceInput) {
  const accessToken = await requireAccessToken();
  return createWorkExperience(data, accessToken);
}

export async function updateExperienceAction(id: string, data: Partial<WorkExperienceInput>) {
  const accessToken = await requireAccessToken();
  return updateWorkExperience(id, data, accessToken);
}

export async function deleteExperienceAction(id: string) {
  const accessToken = await requireAccessToken();
  return deleteWorkExperience(id, accessToken);
}
