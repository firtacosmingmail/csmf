"use server";

import { createClient } from "@/lib/supabase/server";
import { updateAboutMe, type AboutMeInput } from "@/lib/api/about-me";
import { uploadImage, type UploadedImage } from "@/lib/api/images";
import {
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  type SocialLinkInput,
} from "@/lib/api/social-links";

async function requireAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export async function updateAboutMeAction(data: AboutMeInput) {
  const accessToken = await requireAccessToken();
  return updateAboutMe(data, accessToken);
}

export async function uploadAvatarAction(formData: FormData): Promise<UploadedImage> {
  const accessToken = await requireAccessToken();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Missing file");
  return uploadImage(file, accessToken);
}

export async function createSocialLinkAction(data: SocialLinkInput) {
  const accessToken = await requireAccessToken();
  return createSocialLink(data, accessToken);
}

export async function updateSocialLinkAction(id: string, data: Partial<SocialLinkInput>) {
  const accessToken = await requireAccessToken();
  return updateSocialLink(id, data, accessToken);
}

export async function deleteSocialLinkAction(id: string) {
  const accessToken = await requireAccessToken();
  return deleteSocialLink(id, accessToken);
}
