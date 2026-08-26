// Canonical site URL — used for metadataBase, sitemap/robots/feed entries,
// and JSON-LD absolute URLs. Falls back to localhost so `pnpm dev` doesn't
// require the env var to be set. Set NEXT_PUBLIC_SITE_URL in production
// (see .env.example).
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://csmf.ro").replace(/\/$/, "");

export const siteName = "csmf";

export const authorName = "Cosmin F";
