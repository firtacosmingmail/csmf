import { locales } from "@/i18n/locales";
import { listPublishedPosts } from "@/lib/api/posts";
import { getAboutMe } from "@/lib/api/about-me";
import { siteUrl, authorName } from "@/lib/site";

// Regenerated on every request (see app/sitemap.ts for why) so a newly
// published post shows up here without a redeploy. llms.txt is an
// emerging, not-yet-standardized convention for giving LLMs/AI agents a
// plain-text index of a site's key pages, rather than making them crawl
// and parse HTML for it (FLE-59).
export const dynamic = "force-dynamic";

export async function GET() {
  const [aboutMe, ...postsByLocale] = await Promise.all([
    getAboutMe("en"),
    ...locales.map((locale) => listPublishedPosts({ locale })),
  ]);

  const lines: string[] = [`# ${authorName}`, ""];
  if (aboutMe?.headline) lines.push(`> ${aboutMe.headline}`, "");

  lines.push(
    `${siteUrl}/en — homepage (also available at /ro)`,
    `${siteUrl}/en/about — bio, work experience, contact`,
    "",
  );

  locales.forEach((locale, i) => {
    const { posts } = postsByLocale[i];
    if (posts.length === 0) return;
    lines.push(`## Posts (${locale})`);
    for (const post of posts) {
      const description = post.subtitle ? ` — ${post.subtitle}` : "";
      lines.push(`- [${post.title}](${siteUrl}/${locale}/blog/${post.slug})${description}`);
    }
    lines.push("");
  });

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
