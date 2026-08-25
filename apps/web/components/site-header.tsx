import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
      <Link href="/" className="font-serif text-xl text-ink">
        csmf.ro
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
  );
}
