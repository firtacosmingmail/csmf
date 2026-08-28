import Link from "next/link";
import { WaveBanner } from "./wave-banner";
import { LanguageSwitcher } from "./language-switcher";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <div
      // Height scales with viewport width (like joshwcomeau.com's banner) instead of
      // being pinned to fixed breakpoint heights — on a wide viewport the wave art
      // reads at closer to its natural proportions ("zoomed in") rather than being
      // squashed flat; clamp() keeps it sane on very small/very large screens.
      className="relative h-[clamp(13rem,30vw,22rem)] overflow-hidden bg-[linear-gradient(to_bottom,var(--color-sky-from),var(--color-sky-to))]"
    >
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
