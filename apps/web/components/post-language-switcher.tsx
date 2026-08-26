import Link from "next/link";
import { locales, type Locale } from "@/i18n/locales";

const LABEL: Record<Locale, string> = { en: "EN", ro: "RO" };

// Unlike LanguageSwitcher (used elsewhere), a post's translation can live
// at a different slug entirely — so this links straight to each
// translation's own slug instead of swapping a path prefix.
export function PostLanguageSwitcher({
  lang,
  translations,
}: {
  lang: Locale;
  translations: { locale: Locale; slug: string }[];
}) {
  if (translations.length === 0) return null;

  return (
    <div className="flex gap-2 font-sans text-sm text-ink-muted" aria-label="Language">
      {locales.map((locale) => {
        if (locale === lang) {
          return (
            <span key={locale} aria-current="true" className="text-ink">
              {LABEL[locale]}
            </span>
          );
        }
        const translation = translations.find((t) => t.locale === locale);
        if (!translation) return null;
        return (
          <Link key={locale} href={`/${locale}/blog/${translation.slug}`} className="hover:text-ink hover:underline">
            {LABEL[locale]}
          </Link>
        );
      })}
    </div>
  );
}
