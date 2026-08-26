import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAboutMe } from "@/lib/api/about-me";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales, type Locale } from "@/i18n/locales";
import { LegalPage } from "@/components/legal-page";

const LAST_UPDATED: Record<Locale, string> = {
  en: "August 25, 2026",
  ro: "25 august 2026",
};

const METADATA: Record<Locale, { title: string; description: string }> = {
  en: { title: "Code of Conduct", description: "What's expected when commenting on this site." },
  ro: { title: "Cod de conduită", description: "Ce se așteaptă atunci când comentezi pe acest site." },
};

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: METADATA[lang].title,
    description: METADATA[lang].description,
    alternates: {
      canonical: `/${lang}/code-of-conduct`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/code-of-conduct`])),
    },
  };
}

function EnglishContent({ contactEmail }: { contactEmail: string | null | undefined }) {
  return (
    <>
      <p>This applies to comments left on blog posts here. It&apos;s short, because it doesn&apos;t need to be long.</p>

      <h2>Be respectful</h2>
      <p>
        Disagreement is fine; personal attacks, harassment, and hate speech aren&apos;t. Comment on ideas, not
        people.
      </p>

      <h2>Stay on topic</h2>
      <p>No spam, no advertising, no off-topic link-dropping.</p>

      <h2>Nothing illegal</h2>
      <p>Don&apos;t post content that&apos;s illegal or infringes someone else&apos;s rights.</p>

      <h2>What happens if you don&apos;t</h2>
      <p>
        Comments that don&apos;t meet this bar won&apos;t be approved for publication, and previously approved
        comments may be removed later if they&apos;re found to violate it. That&apos;s a moderation decision, not a
        debate.
      </p>

      <h2>Contact</h2>
      <p>
        See something that concerns you?{" "}
        {contactEmail ? (
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        ) : (
          "Reach out via the contact details on the About page."
        )}
      </p>
    </>
  );
}

function RomanianContent({ contactEmail }: { contactEmail: string | null | undefined }) {
  return (
    <>
      <p>Acesta se aplică comentariilor lăsate la articole aici. Este scurt, pentru că nu trebuie să fie lung.</p>

      <h2>Fii respectuos</h2>
      <p>
        Dezacordul este în regulă; atacurile personale, hărțuirea și discursul instigator la ură nu sunt.
        Comentează ideile, nu persoanele.
      </p>

      <h2>Rămâi pe subiect</h2>
      <p>Fără spam, fără publicitate, fără link-uri irelevante.</p>

      <h2>Nimic ilegal</h2>
      <p>Nu posta conținut ilegal sau care încalcă drepturile altcuiva.</p>

      <h2>Ce se întâmplă dacă nu respecți asta</h2>
      <p>
        Comentariile care nu ating acest standard nu vor fi aprobate pentru publicare, iar comentariile aprobate
        anterior pot fi eliminate ulterior dacă se constată că îl încalcă. Aceasta este o decizie de moderare, nu o
        dezbatere.
      </p>

      <h2>Contact</h2>
      <p>
        Ai observat ceva care te îngrijorează?{" "}
        {contactEmail ? (
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        ) : (
          "Contactează-mă prin datele de contact de pe pagina Despre."
        )}
      </p>
    </>
  );
}

export default async function CodeOfConductPage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, aboutMe] = await Promise.all([getDictionary(lang), getAboutMe(lang)]);

  return (
    <LegalPage lang={lang} dict={dict} title={METADATA[lang].title} updated={LAST_UPDATED[lang]}>
      {lang === "ro" ? (
        <RomanianContent contactEmail={aboutMe?.contact_email} />
      ) : (
        <EnglishContent contactEmail={aboutMe?.contact_email} />
      )}
    </LegalPage>
  );
}
