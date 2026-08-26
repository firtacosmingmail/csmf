import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function LegalPage({
  lang,
  dict,
  title,
  updated,
  children,
}: {
  lang: Locale;
  dict: Dictionary;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader lang={lang} dict={dict} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-1">
          <h1 className="font-serif text-4xl text-ink">{title}</h1>
          <p className="font-sans text-sm text-ink-muted">{dict.legal.lastUpdated(updated)}</p>
        </header>
        <div
          className="flex flex-col gap-4 font-sans text-ink-muted
            [&_a]:text-terracotta [&_a]:underline
            [&_h2]:mt-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-ink
            [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-6"
        >
          {children}
        </div>
      </main>
      <SiteFooter lang={lang} dict={dict} />
    </>
  );
}
