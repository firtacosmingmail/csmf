import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAboutMe } from "@/lib/api/about-me";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/locales";
import { LegalPage } from "@/components/legal-page";

const LAST_UPDATED: Record<Locale, string> = {
  en: "August 25, 2026",
  ro: "25 august 2026",
};

const METADATA: Record<Locale, { title: string; description: string }> = {
  en: { title: "Privacy Policy", description: "What this site collects and how it's used." },
  ro: { title: "Politica de confidențialitate", description: "Ce colectează acest site și cum este folosit." },
};

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: METADATA[lang].title, description: METADATA[lang].description };
}

function EnglishContent({ contactEmail }: { contactEmail: string | null | undefined }) {
  return (
    <>
      <p>This page explains what information this site collects and what happens to it.</p>

      <h2>What&apos;s collected</h2>
      <p>There are two ways this site collects personal information, both of which you provide directly:</p>
      <ul>
        <li>
          <strong>Comments</strong> — your name, an optional email address, and the comment text.
        </li>
        <li>
          <strong>Newsletter signup</strong> — your email address, if you choose to subscribe.
        </li>
      </ul>

      <h2>How it&apos;s used</h2>
      <p>
        Once a comment is approved, your name and comment text are shown publicly on the post; your email address
        (if given) is never displayed publicly and is only used to identify you if there&apos;s a reason to follow
        up about your comment. Comments are moderated — nothing is public until approved.
      </p>
      <p>
        A newsletter email address is used solely to let you know when a new post is published. Every notification
        includes a way to unsubscribe, and unsubscribing removes your address immediately.
      </p>

      <h2>Where it&apos;s stored</h2>
      <p>Comments and subscriptions are stored in this site&apos;s Supabase-hosted database.</p>

      <h2>Third parties</h2>
      <p>
        Your information isn&apos;t sold or shared with advertisers. It&apos;s only ever handled by the
        infrastructure providers needed to run the site itself (hosting, database, and — for newsletter
        notifications — an email-delivery provider).
      </p>

      <h2>Cookies &amp; analytics</h2>
      <p>
        As of the date at the top of this page, this site doesn&apos;t use tracking or advertising cookies, or any
        analytics that identify individual visitors. If that changes, this policy will be updated.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for a comment or newsletter subscription tied to your email to be deleted at any time — just
        get in touch.
      </p>

      <h2>Changes</h2>
      <p>This policy may be updated from time to time; the date at the top reflects the last change.</p>

      <h2>Contact</h2>
      <p>
        Questions about this policy, or a data request?{" "}
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
      <p>Această pagină explică ce informații colectează acest site și ce se întâmplă cu ele.</p>

      <h2>Ce se colectează</h2>
      <p>Există două moduri prin care acest site colectează date personale, ambele furnizate direct de tine:</p>
      <ul>
        <li>
          <strong>Comentarii</strong> — numele tău, o adresă de email opțională și textul comentariului.
        </li>
        <li>
          <strong>Abonare la newsletter</strong> — adresa ta de email, dacă alegi să te abonezi.
        </li>
      </ul>

      <h2>Cum este folosit</h2>
      <p>
        Odată ce un comentariu este aprobat, numele tău și textul comentariului sunt afișate public pe articol;
        adresa de email (dacă a fost oferită) nu este niciodată afișată public și este folosită doar dacă există un
        motiv să te contactăm în legătură cu comentariul tău. Comentariile sunt moderate — nimic nu este public
        până nu este aprobat.
      </p>
      <p>
        O adresă de email pentru newsletter este folosită exclusiv pentru a te anunța când public un articol nou.
        Fiecare notificare include o modalitate de dezabonare, iar dezabonarea îți elimină adresa imediat.
      </p>

      <h2>Unde este stocat</h2>
      <p>Comentariile și abonările sunt stocate în baza de date Supabase a acestui site.</p>

      <h2>Terți</h2>
      <p>
        Datele tale nu sunt vândute sau partajate cu agenți de publicitate. Sunt gestionate doar de furnizorii de
        infrastructură necesari pentru funcționarea site-ului (hosting, bază de date și — pentru notificările prin
        newsletter — un furnizor de livrare a emailurilor).
      </p>

      <h2>Cookie-uri &amp; analiză</h2>
      <p>
        La data de la începutul acestei pagini, acest site nu folosește cookie-uri de urmărire sau publicitate, și
        nici analiză care identifică vizitatori individuali. Dacă acest lucru se schimbă, politica va fi
        actualizată.
      </p>

      <h2>Drepturile tale</h2>
      <p>
        Poți cere oricând ștergerea unui comentariu sau a unei abonări la newsletter asociate emailului tău — pur
        și simplu contactează-mă.
      </p>

      <h2>Modificări</h2>
      <p>Această politică poate fi actualizată din când în când; data de la începutul paginii reflectă ultima modificare.</p>

      <h2>Contact</h2>
      <p>
        Întrebări despre această politică, sau o cerere legată de date?{" "}
        {contactEmail ? (
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        ) : (
          "Contactează-mă prin datele de contact de pe pagina Despre."
        )}
      </p>
    </>
  );
}

export default async function PrivacyPage({ params }: { params: Params }) {
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
