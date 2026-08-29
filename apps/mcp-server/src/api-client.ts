import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { Config } from "./config.js";
import type { AdminAuth } from "./auth.js";

// Thin client for the same Edge Functions REST API apps/web/lib/api/*.ts
// calls (apps/supabase/functions/) — this process is just another
// authenticated caller of it, using an admin session instead of a cookie.
// Never talks to Postgres/PostgREST directly, matching the rest of the repo.

export type Post = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  status: "draft" | "published";
  pinned: boolean;
  preview_image_url: string | null;
  preview_image_alt: string | null;
  preview_image_block_id: string | null;
  published_at: string | null;
  locale: "en" | "ro";
  translation_group_id: string;
  created_at: string;
  updated_at: string;
};

export type PostBlockType = "heading" | "subheading" | "paragraph" | "code" | "separator" | "image";

export type PostBlock = {
  id: string;
  post_id: string;
  type: PostBlockType;
  display_order: number;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type UploadedImage = { url: string; width: number; height: number };

export type WorkExperience = {
  id: string;
  company: string;
  role: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  locale: "en" | "ro";
  translation_group_id: string;
  created_at: string;
  updated_at: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private readonly functionsUrl: string;

  constructor(
    private readonly config: Config,
    private readonly auth: AdminAuth,
  ) {
    this.functionsUrl = `${config.supabaseUrl}/functions/v1`;
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const accessToken = await this.auth.getAccessToken();
    return fetch(`${this.functionsUrl}${path}`, {
      ...init,
      headers: {
        apikey: this.config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        ...init.headers,
      },
    });
  }

  private async json<T>(path: string, init: RequestInit, key: string): Promise<T> {
    const res = await this.request(path, init);
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new ApiError(typeof body.error === "string" ? body.error : `Request failed: ${res.status}`, res.status);
    }
    return body[key] as T;
  }

  // ---- posts ----

  listPosts(opts: { status?: string; locale?: string; pinned?: boolean } = {}): Promise<Post[]> {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.locale) params.set("locale", opts.locale);
    if (opts.pinned !== undefined) params.set("pinned", String(opts.pinned));
    const qs = params.size ? `?${params}` : "";
    return this.json<Post[]>(`/posts${qs}`, {}, "posts");
  }

  async getPostById(id: string): Promise<Post | null> {
    const posts = await this.json<Post[]>(`/posts?id=${encodeURIComponent(id)}`, {}, "posts");
    return posts[0] ?? null;
  }

  async getPostBySlug(slug: string, locale = "en"): Promise<{ post: Post; blocks: PostBlock[] } | null> {
    const res = await this.request(`/posts/${encodeURIComponent(slug)}?locale=${locale}`, {});
    if (res.status === 404) return null;
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new ApiError(typeof body.error === "string" ? body.error : `Request failed: ${res.status}`, res.status);
    const post = body.post as Post & { post_blocks: PostBlock[] };
    const { post_blocks, ...rest } = post;
    return { post: rest as Post, blocks: post_blocks ?? [] };
  }

  createPost(data: {
    title: string;
    subtitle?: string | null;
    slug: string;
    status?: "draft" | "published";
    pinned?: boolean;
    locale?: string;
    translation_group_id?: string;
  }): Promise<Post> {
    return this.json<Post>(
      "/posts",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
      "post",
    );
  }

  updatePost(
    id: string,
    data: Partial<{ title: string; subtitle: string | null; slug: string; status: "draft" | "published"; pinned: boolean }>,
  ): Promise<Post> {
    return this.json<Post>(
      `/posts/${encodeURIComponent(id)}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
      "post",
    );
  }

  async deletePost(id: string): Promise<void> {
    const res = await this.request(`/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new ApiError(typeof body.error === "string" ? body.error : `Failed to delete post: ${res.status}`, res.status);
    }
  }

  setPreviewImage(postId: string, previewImageBlockId: string | null): Promise<Post> {
    return this.json<Post>(
      `/posts/${encodeURIComponent(postId)}/preview-image`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview_image_block_id: previewImageBlockId }),
      },
      "post",
    );
  }

  // ---- blocks ----

  createBlock(postId: string, data: { type: PostBlockType; content: Record<string, unknown>; display_order?: number }): Promise<PostBlock> {
    return this.json<PostBlock>(
      `/posts/${encodeURIComponent(postId)}/blocks`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
      "block",
    );
  }

  updateBlock(id: string, data: Partial<{ content: Record<string, unknown>; display_order: number }>): Promise<PostBlock> {
    return this.json<PostBlock>(
      `/blocks/${encodeURIComponent(id)}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
      "block",
    );
  }

  async deleteBlock(id: string): Promise<void> {
    const res = await this.request(`/blocks/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new ApiError(typeof body.error === "string" ? body.error : `Failed to delete block: ${res.status}`, res.status);
    }
  }

  // ---- work experience ----

  listWorkExperience(locale?: string): Promise<WorkExperience[]> {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    return this.json<WorkExperience[]>(`/work-experience${qs}`, {}, "work_experience");
  }

  createWorkExperience(data: {
    company: string;
    role: string;
    description?: string;
    start_date?: string | null;
    end_date?: string | null;
    display_order?: number;
    locale?: string;
    translation_group_id?: string;
  }): Promise<WorkExperience> {
    return this.json<WorkExperience>(
      "/work-experience",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
      "work_experience",
    );
  }

  updateWorkExperience(
    id: string,
    data: Partial<{
      company: string;
      role: string;
      description: string;
      start_date: string | null;
      end_date: string | null;
      display_order: number;
      locale: string;
      translation_group_id: string;
    }>,
  ): Promise<WorkExperience> {
    return this.json<WorkExperience>(
      `/work-experience/${encodeURIComponent(id)}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
      "work_experience",
    );
  }

  async deleteWorkExperience(id: string): Promise<void> {
    const res = await this.request(`/work-experience/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new ApiError(
        typeof body.error === "string" ? body.error : `Failed to delete work experience: ${res.status}`,
        res.status,
      );
    }
  }

  // ---- images ----

  async uploadImageFromPath(filePath: string): Promise<UploadedImage> {
    const buffer = await readFile(filePath);
    return this.uploadImageBytes(buffer, filePath.split("/").pop() ?? "image", mimeTypeForExtension(extname(filePath)));
  }

  async uploadImageFromUrl(imageUrl: string): Promise<UploadedImage> {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to download image from ${imageUrl}: HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? undefined;
    const name = new URL(imageUrl).pathname.split("/").pop() || "image";
    return this.uploadImageBytes(buffer, name, contentType ?? mimeTypeForExtension(extname(name)));
  }

  // For a caller that can't give this process a filesystem path — e.g. the
  // Vercel-deployed HTTP server has no access to the MCP *client's* local
  // files — the client reads the file itself and sends its bytes inline
  // instead.
  async uploadImageFromBase64(data: string, fileName?: string, mimeType?: string): Promise<UploadedImage> {
    let buffer: Buffer;
    try {
      buffer = Buffer.from(data, "base64");
    } catch {
      throw new Error("fileData is not valid base64");
    }
    if (buffer.length === 0) throw new Error("fileData decoded to an empty file");
    const name = fileName ?? "image";
    return this.uploadImageBytes(buffer, name, mimeType ?? mimeTypeForExtension(extname(name)));
  }

  private async uploadImageBytes(bytes: Buffer, filename: string, contentType: string | undefined): Promise<UploadedImage> {
    const formData = new FormData();
    const file = new File([new Uint8Array(bytes)], filename, contentType ? { type: contentType } : {});
    formData.append("file", file);
    const res = await this.request("/images", { method: "POST", body: formData });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new ApiError(typeof body.error === "string" ? body.error : `Failed to upload image: ${res.status}`, res.status);
    }
    return body as unknown as UploadedImage;
  }
}

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

function mimeTypeForExtension(ext: string): string | undefined {
  return EXTENSION_MIME_TYPES[ext.toLowerCase()];
}
