import type { Metadata } from "next";
import { Newsreader, Source_Sans_3, JetBrains_Mono, Caveat } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Wordmark-only display face (FLE-46) — a playful/handwritten accent
// against the clean sans body type, not used for body copy anywhere.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "csmf",
  description: "Personal blog",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set by proxy.ts for locale-prefixed public routes; falls back to "en"
  // for /admin (which isn't localized).
  const lang = (await headers()).get("x-locale") ?? "en";

  return (
    <html
      lang={lang}
      className={`${newsreader.variable} ${sourceSans.variable} ${jetbrainsMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
