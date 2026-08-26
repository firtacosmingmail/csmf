import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// AI/answer-engine crawlers, listed explicitly (FLE-60) rather than left to
// whatever the wildcard rule happens to do — this site's purpose is
// self-promotion, so being found and cited by these is a deliberate goal,
// not an accident. Functionally redundant with the "*" rule below (which
// already allows everyone but /admin), but explicit documents the decision
// and survives someone tightening "*" later without noticing this list.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: "/admin" })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
