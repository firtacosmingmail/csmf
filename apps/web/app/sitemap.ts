import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/locales";
import { listPublishedPosts } from "@/lib/api/posts";
import { siteUrl } from "@/lib/site";

// Static, non-post routes that exist per locale.
const STATIC_PATHS = ["", "/about", "/terms", "/privacy", "/code-of-conduct"];

// Posts are published through the admin CMS without a redeploy, so this
// sitemap must be computed on every request, not frozen at build time —
// otherwise a newly published post wouldn't appear until the next deploy.
// `listPublishedPosts` already goes through `apiFetch`'s `cache: "no-store"`,
// which should make Next infer this route as dynamic on its own, but that
// inference isn't relied on here (see FLE-51).
export const dynamic = "force-dynamic";

function languageMap(pathFor: (locale: Locale) => string): Record<string, string> {
  return Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}${pathFor(locale)}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postsByLocale = await Promise.all(locales.map((locale) => listPublishedPosts({ locale })));

  // Pair up translations by translation_group_id so each post entry can
  // also carry hreflang alternates in the sitemap itself. Search engines
  // mainly read the per-page <link rel="alternate"> tags (set in
  // generateMetadata), but sitemap-level hreflang is a cheap, recommended
  // belt-and-suspenders on top of that.
  const slugsByGroup = new Map<string, Partial<Record<Locale, string>>>();
  locales.forEach((locale, i) => {
    for (const post of postsByLocale[i].posts) {
      const entry = slugsByGroup.get(post.translation_group_id) ?? {};
      entry[locale] = post.slug;
      slugsByGroup.set(post.translation_group_id, entry);
    }
  });

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      changeFrequency: path === "" ? "daily" : "monthly",
      alternates: { languages: languageMap((l) => `/${l}${path}`) },
    })),
  );

  const postEntries: MetadataRoute.Sitemap = locales.flatMap((locale, i) =>
    postsByLocale[i].posts.map((post) => {
      const siblingSlugs = slugsByGroup.get(post.translation_group_id) ?? {};
      return {
        url: `${siteUrl}/${locale}/blog/${post.slug}`,
        lastModified: post.updated_at,
        changeFrequency: "monthly" as const,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(siblingSlugs).map(([l, slug]) => [l, `${siteUrl}/${l}/blog/${slug}`]),
          ),
        },
      };
    }),
  );

  return [...staticEntries, ...postEntries];
}
