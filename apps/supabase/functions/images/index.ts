import { Hono } from "hono";
import { imageSize } from "image-size";
import { createScopedClient } from "../_shared/client.ts";
import { statusForStorageError } from "../_shared/http.ts";

const app = new Hono().basePath("/images");

// Admin only (RLS on storage.objects rejects an anon upload). Multipart
// body with a `file` field; returns the public URL plus the dimensions
// image blocks need for layout, so the client never has to load the image
// itself just to know its size.
app.post("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Expected multipart/form-data" }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return c.json({ error: "Missing file" }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let width: number | undefined;
  let height: number | undefined;
  let type: string | undefined;
  try {
    ({ width, height, type } = imageSize(bytes));
  } catch {
    return c.json({ error: "Not a valid image file" }, 400);
  }
  if (!width || !height) {
    return c.json({ error: "Not a valid image file" }, 400);
  }

  const path = `${crypto.randomUUID()}.${type ?? "bin"}`;
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(path, bytes, { contentType: file.type || undefined });

  if (uploadError) {
    const statusCode = "statusCode" in uploadError ? (uploadError as { statusCode?: string }).statusCode : undefined;
    return c.json({ error: uploadError.message }, statusForStorageError(statusCode));
  }

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return c.json({ url: data.publicUrl, width, height }, 201);
});

Deno.serve(app.fetch);
