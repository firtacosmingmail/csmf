import type { Metadata } from "next";
import { getAboutMe } from "@/lib/api/about-me";
import { getWorkExperience } from "@/lib/api/work-experience";
import { sortByStartDateDesc } from "@/lib/sort-experience";
import { stripHtml } from "@/lib/text-content";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

export async function generateMetadata(): Promise<Metadata> {
  const aboutMe = await getAboutMe();
  const description = aboutMe?.bio ? stripHtml(aboutMe.bio) : undefined;

  return {
    title: "About",
    description,
    openGraph: { title: "About", description, type: "profile" },
  };
}

export default async function AboutPage() {
  const [aboutMe, workExperience] = await Promise.all([getAboutMe(), getWorkExperience()]);
  const experience = sortByStartDateDesc(workExperience);

  return (
    <>
      <SiteHeader />

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
            <h2 className="font-serif text-2xl text-ink">Experience</h2>
            <ol className="flex flex-col gap-6">
              {experience.map((item) => (
                <li key={item.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-serif text-lg text-ink">
                      {item.role} · {item.company}
                    </span>
                    <span className="font-sans text-sm text-ink-muted">
                      {formatDate(item.start_date)} – {item.end_date ? formatDate(item.end_date) : "Present"}
                    </span>
                  </div>
                  {item.description && <p className="font-sans text-ink-muted">{item.description}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
