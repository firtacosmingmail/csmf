import Link from "next/link";
import { getSocialLinks } from "@/lib/api/social-links";
import { WaveFooterBackground } from "./wave-footer-background";
import { NewsletterForm } from "./newsletter-form";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export async function SiteFooter({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const socialLinks = await getSocialLinks();

  return (
    <footer className="relative mt-24 bg-paper-raised">
      <WaveFooterBackground />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-24 pb-12 font-sans text-sm text-ink-muted sm:pt-32">
        <nav className="flex flex-wrap gap-4">
          <Link href={`/${lang}/about`} className="hover:text-ink hover:underline">
            {dict.nav.about}
          </Link>
          {/* Terms/Privacy open in a new tab, Code of Conduct doesn't — see FLE-48 */}
          <Link
            href={`/${lang}/terms`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink hover:underline"
          >
            {dict.footer.termsOfUse}
          </Link>
          <Link
            href={`/${lang}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink hover:underline"
          >
            {dict.footer.privacyPolicy}
          </Link>
          <Link href={`/${lang}/code-of-conduct`} className="hover:text-ink hover:underline">
            {dict.footer.codeOfConduct}
          </Link>
        </nav>

        {socialLinks.length > 0 && (
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink hover:underline"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-ink">{dict.footer.newsletterIntro}</p>
          <NewsletterForm dict={dict.newsletter} />
        </div>

        <p>© {new Date().getFullYear()} Cosmin F</p>
      </div>
    </footer>
  );
}
