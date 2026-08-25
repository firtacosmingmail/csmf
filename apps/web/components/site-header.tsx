import Link from "next/link";
import { WaveBanner } from "./wave-banner";

export function SiteHeader() {
  return (
    <div className="relative h-44 overflow-hidden bg-paper sm:h-56">
      <WaveBanner />
      <header className="relative mx-auto flex h-full w-full max-w-4xl items-center justify-between px-6">
        <Link href="/" className="font-hand text-4xl text-ink">
          Cosmin F
        </Link>
        <nav className="flex gap-4 font-sans text-sm text-ink-muted">
          <Link href="/" className="hover:text-ink hover:underline">
            Home
          </Link>
          <Link href="/about" className="hover:text-ink hover:underline">
            About
          </Link>
        </nav>
      </header>
    </div>
  );
}
