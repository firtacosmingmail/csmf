"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/locales";

const LABEL: Record<Locale, string> = { en: "EN", ro: "RO" };

// Generic locale switcher for pages whose path is identical across
// locales (home, about, legal pages) — swaps the /en//ro/ prefix and
// keeps the rest of the path. Blog posts use their own switcher instead
// (post-language-switcher.tsx), since a translated post can live at a
// different slug.
export function LanguageSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <div className="flex gap-2 font-sans text-sm text-ink-muted" aria-label="Language">
      {locales.map((locale) =>
        locale === lang ? (
          <span key={locale} aria-current="true" className="text-ink">
            {LABEL[locale]}
          </span>
        ) : (
          <Link key={locale} href={`/${locale}${rest ? `/${rest}` : ""}`} className="hover:text-ink hover:underline">
            {LABEL[locale]}
          </Link>
        ),
      )}
    </div>
  );
}
