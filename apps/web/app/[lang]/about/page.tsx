import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAboutMe } from "@/lib/api/about-me";
import { getWorkExperience } from "@/lib/api/work-experience";
import { getSocialLinks } from "@/lib/api/social-links";
import { sortByStartDateDesc } from "@/lib/sort-experience";
import { stripHtml } from "@/lib/text-content";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { siteUrl, authorName } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";

type Params = Promise<{ lang: string }>;

function formatDate(date: string | null, lang: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString(lang, { year: "numeric", month: "short" });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const aboutMe = await getAboutMe(lang);
  const description = aboutMe?.bio ? stripHtml(aboutMe.bio) : undefined;

  return {
    title: dict.about.title,
    description,
    alternates: {
      canonical: `/${lang}/about`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/about`])),
    },
    openGraph: {
      title: dict.about.title,
      description,
      type: "profile",
      images: [aboutMe?.avatar_url ?? "/opengraph-image"],
    },
  };
}

export default async function AboutPage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, aboutMe, workExperience, socialLinks] = await Promise.all([
    getDictionary(lang),
    getAboutMe(lang),
    getWorkExperience(lang),
    getSocialLinks(),
  ]);
  const experience = sortByStartDateDesc(workExperience);

  // FLE-54: Person JSON-LD — the About page has the richest identity data
  // (bio, avatar, work history, social profiles), so it's the natural home
  // for this rather than duplicating a thinner version on the home page.
  const latestRole = experience[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: authorName,
    url: `${siteUrl}/${lang}/about`,
    ...(aboutMe?.avatar_url ? { image: aboutMe.avatar_url } : {}),
    ...(aboutMe?.bio ? { description: stripHtml(aboutMe.bio) } : {}),
    ...(aboutMe?.contact_email ? { email: aboutMe.contact_email } : {}),
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.map((link) => link.url) } : {}),
    ...(latestRole
      ? { jobTitle: latestRole.role, worksFor: { "@type": "Organization", name: latestRole.company } }
      : {}),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader lang={lang} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 pb-16">
        <section className="flex flex-col gap-4 py-8">
          {aboutMe?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image URL
            <img src={aboutMe.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" />
          )}
          {aboutMe?.headline && <h1 className="font-serif text-4xl text-ink">{aboutMe.headline}</h1>}
          {aboutMe?.bio && (
            <div
              className="max-w-xl font-sans text-ink-muted [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: aboutMe.bio }}
            />
          )}
          {aboutMe?.contact_email && (
            <a href={`mailto:${aboutMe.contact_email}`} className="font-sans text-terracotta hover:underline">
              {aboutMe.contact_email}
            </a>
          )}
        </section>

        {experience.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="font-serif text-2xl text-ink">{dict.about.experience}</h2>
            <ol className="flex flex-col gap-6">
              {experience.map((item) => (
                <li key={item.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-serif text-lg text-ink">
                      {item.role} · {item.company}
                    </span>
                    <span className="font-sans text-sm text-ink-muted">
                      {formatDate(item.start_date, lang)} –{" "}
                      {item.end_date ? formatDate(item.end_date, lang) : dict.about.present}
                    </span>
                  </div>
                  {item.description && <p className="font-sans text-ink-muted">{item.description}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      <SiteFooter lang={lang} dict={dict} />
    </>
  );
}
