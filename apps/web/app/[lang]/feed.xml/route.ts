import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { listPublishedPosts } from "@/lib/api/posts";
import { getAboutMe } from "@/lib/api/about-me";
import { siteUrl, authorName } from "@/lib/site";

// Regenerated on every request (see app/sitemap.ts for why) so a newly
// published post appears in the feed without a redeploy (FLE-61).
export const dynamic = "force-dynamic";

type Params = Promise<{ lang: string }>;

function escapeXml(value: string): string {
  const entities: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
  return value.replace(/[<>&'"]/g, (char) => entities[char]);
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [aboutMe, { posts }] = await Promise.all([getAboutMe(lang), listPublishedPosts({ locale: lang })]);

  const title = aboutMe?.headline ?? authorName;
  const description = aboutMe?.bio ? aboutMe.bio.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : `${authorName}'s blog`;
  const feedUrl = `${siteUrl}/${lang}/feed.xml`;
  const homeUrl = `${siteUrl}/${lang}`;

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/${lang}/blog/${post.slug}`;
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : undefined;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : "",
        post.subtitle ? `      <description>${escapeXml(post.subtitle)}</description>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${homeUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>${lang}</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
