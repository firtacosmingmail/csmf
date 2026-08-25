import { apiFetch } from "./client";

export type UploadedImage = { url: string; width: number; height: number };

export async function uploadImage(file: File, accessToken: string): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch("/images", {
    method: "POST",
    accessToken,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to upload image: ${res.status}`);
  }
  return res.json();
}
