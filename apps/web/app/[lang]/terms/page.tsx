import type { Metadata } from "next";
import Link from "next/link";
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
  en: { title: "Terms of Use", description: "Terms of use for csmf.ro." },
  ro: { title: "Termeni de utilizare", description: "Termenii de utilizare pentru csmf.ro." },
};

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: METADATA[lang].title,
    description: METADATA[lang].description,
    alternates: {
      canonical: `/${lang}/terms`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/terms`])),
    },
  };
}

function EnglishContent({ contactEmail }: { contactEmail: string | null | undefined }) {
  return (
    <>
      <p>
        This is a personal blog. By reading it, leaving a comment, or subscribing to the newsletter, you agree to
        the terms below.
      </p>

      <h2>Comments</h2>
      <p>
        You&apos;re welcome to leave comments on posts. Comments are moderated — they&apos;re not visible publicly
        until approved, and may be rejected or removed at any time, for any reason, without notice (see the{" "}
        <Link href="/en/code-of-conduct">Code of Conduct</Link> for what&apos;s expected). You retain ownership of anything
        you write, but by submitting a comment you grant this site a license to display it publicly once approved.
      </p>
      <p>Don&apos;t post anything illegal, abusive, spammy, or that infringes someone else&apos;s rights.</p>

      <h2>Content ownership</h2>
      <p>
        Posts and other content on this site belong to the site owner unless stated otherwise. Feel free to link to
        or quote from posts (with attribution); don&apos;t republish full posts elsewhere without permission.
      </p>

      <h2>No warranty</h2>
      <p>
        This site is provided as-is, with no guarantee of uptime, accuracy, or fitness for any particular purpose.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated from time to time; the date at the top of this page reflects the last change.
        Continuing to use the site after a change means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms?{" "}
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
      <p>
        Acesta este un blog personal. Citindu-l, lăsând un comentariu sau abonându-te la newsletter, ești de acord
        cu termenii de mai jos.
      </p>

      <h2>Comentarii</h2>
      <p>
        Ești binevenit să lași comentarii la articole. Comentariile sunt moderate — nu sunt vizibile public până nu
        sunt aprobate și pot fi respinse sau eliminate oricând, din orice motiv, fără preaviz (vezi{" "}
        <Link href="/ro/code-of-conduct">Codul de conduită</Link> pentru ce se așteaptă). Rămâi proprietarul a ceea ce
        scrii, dar prin trimiterea unui comentariu acorzi acestui site o licență de a-l afișa public după aprobare.
      </p>
      <p>Nu posta nimic ilegal, abuziv, spam sau care încalcă drepturile altcuiva.</p>

      <h2>Proprietatea conținutului</h2>
      <p>
        Articolele și celălalt conținut de pe acest site aparțin proprietarului site-ului, dacă nu se specifică
        altfel. Simte-te liber să faci link sau să citezi din articole (cu atribuire); nu republica articole
        integrale în altă parte fără permisiune.
      </p>

      <h2>Fără garanție</h2>
      <p>
        Acest site este oferit ca atare, fără nicio garanție privind disponibilitatea, acuratețea sau adecvarea
        pentru un anumit scop.
      </p>

      <h2>Modificări</h2>
      <p>
        Acești termeni pot fi actualizați din când în când; data de la începutul acestei pagini reflectă ultima
        modificare. Continuarea utilizării site-ului după o modificare înseamnă că accepți termenii actualizați.
      </p>

      <h2>Contact</h2>
      <p>
        Întrebări despre acești termeni?{" "}
        {contactEmail ? (
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        ) : (
          "Contactează-mă prin datele de contact de pe pagina Despre."
        )}
      </p>
    </>
  );
}

export default async function TermsPage({ params }: { params: Params }) {
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
