import Link from "next/link";
import { WaveBanner } from "./wave-banner";
import { LanguageSwitcher } from "./language-switcher";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <div className="relative h-44 overflow-hidden bg-paper sm:h-56">
      <WaveBanner />
      <header className="relative mx-auto flex h-full w-full max-w-4xl items-center justify-between px-6">
        <Link href={`/${lang}`} className="font-hand text-4xl text-ink">
          Cosmin F
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex gap-4 font-sans text-sm text-ink-muted">
            <Link href={`/${lang}`} className="hover:text-ink hover:underline">
              {dict.nav.home}
            </Link>
            <Link href={`/${lang}/about`} className="hover:text-ink hover:underline">
              {dict.nav.about}
            </Link>
          </nav>
          <LanguageSwitcher lang={lang} />
        </div>
      </header>
    </div>
  );
}
